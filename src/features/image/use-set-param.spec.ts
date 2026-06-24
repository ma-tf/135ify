import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUpdateParams, mockReprocess, mockReprocessDebounced } = vi.hoisted(() => ({
  mockUpdateParams: vi.fn(),
  mockReprocess: vi.fn(),
  mockReprocessDebounced: vi.fn(),
}));

vi.mock("@providers/storage-context", () => ({
  useStorage: () => ({ updateParams: mockUpdateParams }),
}));

vi.mock("@features/image/use-reprocess-image", () => ({
  useReprocessImage: () => ({
    reprocess: mockReprocess,
    reprocessDebounced: mockReprocessDebounced,
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
  it("merges partial params and calls reprocessDebounced immediately", () => {
    const setImageSrc = vi.fn();
    const { result } = renderHook(() =>
      useSetParam("file-1", "blob:url", DEFAULT_PARAMS, setImageSrc),
    );

    act(() => {
      result.current({ grainIntensity: 50 });
    });

    expect(mockReprocessDebounced).toHaveBeenCalledOnce();
    expect(mockReprocessDebounced).toHaveBeenCalledWith({
      ...DEFAULT_PARAMS,
      grainIntensity: 50,
    });
  });

  it("coalesces rapid successive calls into leading and trailing edges", () => {
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

    expect(mockUpdateParams).toHaveBeenCalledTimes(1);
    expect(mockUpdateParams).toHaveBeenCalledWith("file-1", {
      ...DEFAULT_PARAMS,
      grainIntensity: 10,
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateParams).toHaveBeenCalledTimes(2);
    expect(mockUpdateParams).toHaveBeenLastCalledWith("file-1", {
      ...DEFAULT_PARAMS,
      grainIntensity: 30,
    });
  });
});
