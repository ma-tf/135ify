import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUpdateParams, mockReprocess } = vi.hoisted(() => ({
  mockUpdateParams: vi.fn(),
  mockReprocess: vi.fn(),
}));

vi.mock("@providers/storage-context", () => ({
  useStorage: () => ({ updateParams: mockUpdateParams }),
}));

vi.mock("@features/image/use-reprocess-image", () => ({
  useReprocessImage: () => ({
    reprocess: mockReprocess,
  }),
}));

import { useSetParam } from "./use-set-param";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSetParam", () => {
  it("merges partial params and debounces save and reprocess", () => {
    const setImageSrc = vi.fn();
    const { result } = renderHook(() =>
      useSetParam("file-1", "blob:url", DEFAULT_PARAMS, setImageSrc),
    );

    act(() => {
      result.current({ grainIntensity: 50 });
    });

    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(mockReprocess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUpdateParams).toHaveBeenCalledOnce();
    expect(mockUpdateParams).toHaveBeenCalledWith("file-1", {
      ...DEFAULT_PARAMS,
      grainIntensity: 50,
    });
    expect(mockReprocess).toHaveBeenCalledOnce();
    expect(mockReprocess).toHaveBeenCalledWith({
      ...DEFAULT_PARAMS,
      grainIntensity: 50,
    });
  });

  it("coalesces rapid successive calls into single trailing edge", () => {
    const setImageSrc = vi.fn();
    const { result } = renderHook(() =>
      useSetParam("file-1", "blob:url", DEFAULT_PARAMS, setImageSrc),
    );

    act(() => {
      result.current({ grainIntensity: 10 });
    });
    act(() => {
      result.current({ grainIntensity: 20 });
    });
    act(() => {
      result.current({ grainIntensity: 30 });
    });

    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(mockReprocess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockUpdateParams).toHaveBeenCalledOnce();
    expect(mockUpdateParams).toHaveBeenCalledWith("file-1", {
      ...DEFAULT_PARAMS,
      grainIntensity: 30,
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockReprocess).toHaveBeenCalledOnce();
    expect(mockReprocess).toHaveBeenCalledWith({
      ...DEFAULT_PARAMS,
      grainIntensity: 30,
    });
  });
});
