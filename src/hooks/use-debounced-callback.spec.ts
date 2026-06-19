import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { useDebouncedCallback } from "./use-debounced-callback";

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useDebouncedCallback", () => {
  describe("debounced", () => {
    it("does not invoke fn immediately", () => {
      const fn = vi.fn();
      renderHook(() => useDebouncedCallback(fn, 100));

      expect(fn).not.toHaveBeenCalled();
    });

    it("invokes fn after delay", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("resets timer on rapid successive calls", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced();
      result.current.debounced();
      result.current.debounced();

      vi.advanceTimersByTime(99);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("passes latest args to fn", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced("a");
      result.current.debounced("b");
      result.current.debounced("c");

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith("c");
    });

    it("uses latest fn on each render", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const { result, rerender } = renderHook(({ fn }) => useDebouncedCallback(fn, 100), {
        initialProps: { fn: fn1 },
      });

      result.current.debounced();
      rerender({ fn: fn2 });

      vi.advanceTimersByTime(100);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it("fires separately for each debounce window", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced();
      vi.advanceTimersByTime(100);

      result.current.debounced();
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does not fire after unmount", () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced();
      unmount();

      vi.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });

    it("has stable identity when delay is unchanged", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(() => useDebouncedCallback(fn, 100));

      const first = result.current.debounced;
      rerender();
      const second = result.current.debounced;

      expect(first).toBe(second);
    });
  });

  describe("flush", () => {
    it("immediately invokes fn with provided args", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.flush("hello");

      expect(fn).toHaveBeenCalledWith("hello");
      expect(fn).toHaveBeenCalledOnce();
    });

    it("cancels pending debounced call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.debounced();
      result.current.flush();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("works with no pending debounced call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(fn, 100));

      result.current.flush("safe");

      expect(fn).toHaveBeenCalledWith("safe");
    });

    it("uses latest fn on each render", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const { result, rerender } = renderHook(({ fn }) => useDebouncedCallback(fn, 100), {
        initialProps: { fn: fn1 },
      });

      rerender({ fn: fn2 });

      result.current.flush();
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it("has stable identity across re-renders", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(() => useDebouncedCallback(fn, 100));

      const first = result.current.flush;
      rerender();
      const second = result.current.flush;

      expect(first).toBe(second);
    });
  });
});
