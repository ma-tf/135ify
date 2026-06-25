import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { useDebounce } from "./use-debounce";

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useDebounce", () => {
  describe("debounced", () => {
    it("invokes fn immediately on first call (leading edge)", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();

      expect(fn).toHaveBeenCalledOnce();
    });

    it("invokes fn again after delay (trailing edge)", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("resets timer on rapid successive calls", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      result.current.debounced();
      result.current.debounced();

      vi.advanceTimersByTime(99);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("passes latest args to trailing invocation", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced("a");
      result.current.debounced("b");
      result.current.debounced("c");

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("c");
    });

    it("uses latest fn across renders", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 100), {
        initialProps: { fn: fn1 },
      });

      result.current.debounced();
      rerender({ fn: fn2 });

      vi.advanceTimersByTime(100);

      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it("fires separately for each debounce window", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      vi.advanceTimersByTime(100);

      result.current.debounced();
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("does not fire trailing edge after unmount", () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      unmount();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("has stable identity when only callback changes", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 100), {
        initialProps: { fn: fn1 },
      });

      const first = result.current.debounced;
      rerender({ fn: fn2 });
      const second = result.current.debounced;

      expect(first).toBe(second);
    });

    it("gets new identity when delay changes", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(({ delay }) => useDebounce(fn, delay), {
        initialProps: { delay: 100 },
      });

      const first = result.current.debounced;
      rerender({ delay: 200 });
      const second = result.current.debounced;

      expect(first).not.toBe(second);
    });

    it("gets new identity when options change", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(({ opts }) => useDebounce(fn, 100, opts), {
        initialProps: { opts: undefined as { leading?: boolean } | undefined },
      });

      const first = result.current.debounced;
      rerender({ opts: { leading: true } });
      const second = result.current.debounced;

      expect(first).not.toBe(second);
    });
  });

  describe("flush", () => {
    it("immediately invokes fn with provided args", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.flush("hello");

      expect(fn).toHaveBeenCalledWith("hello");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("cancels pending debounced call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      result.current.flush();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("works with no pending debounced call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.flush("safe");

      expect(fn).toHaveBeenCalledWith("safe");
    });

    it("uses latest fn on each render", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 100), {
        initialProps: { fn: fn1 },
      });

      rerender({ fn: fn2 });
      result.current.flush();

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it("has stable identity across re-renders", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 100), {
        initialProps: { fn },
      });

      const first = result.current.flush;
      rerender({ fn: vi.fn() });
      const second = result.current.flush;

      expect(first).toBe(second);
    });
  });

  describe("cancel", () => {
    it("cancels pending debounced call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.debounced();
      result.current.cancel();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does nothing with no pending call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounce(fn, 100));

      result.current.cancel();

      expect(fn).not.toHaveBeenCalled();
    });

    it("has stable identity across re-renders", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useDebounce(fn, 100), {
        initialProps: { fn },
      });

      const first = result.current.cancel;
      rerender({ fn: vi.fn() });
      const second = result.current.cancel;

      expect(first).toBe(second);
    });
  });
});
