import { useGalleryClientStore } from "@stores/gallery-client-store";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseMutation } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: mockUseMutation,
}));

import { useGalleryUpdateParams } from "@features/gallery/use-gallery-update-params";

describe("useGalleryUpdateParams", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockMutate);
    useGalleryClientStore.setState({
      localParams: null,
      localRenderUrl: null,
      localIsProcessing: false,
      localRenderError: null,
      imageCache: {},
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("calls mergeParamsWithSnapshot with given params", () => {
    const mergeSpy = vi.spyOn(useGalleryClientStore.getState(), "mergeParamsWithSnapshot");
    mockMutate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    expect(mergeSpy).toHaveBeenCalledWith({ grainIntensity: 50 });
    mergeSpy.mockRestore();
  });

  it("clears renderUrl and renderError via setImageCacheEntry", () => {
    useGalleryClientStore.setState({
      imageCache: {
        "img-1": { renderUrl: "blob:old", isProcessing: false, renderError: "old error" },
      },
    });
    mockMutate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    const entry = useGalleryClientStore.getState().imageCache["img-1"];
    expect(entry?.renderUrl).toBeNull();
    expect(entry?.renderError).toBeNull();
  });

  it("calls convexUpdateParams mutation with imageId and params", () => {
    mockMutate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    expect(mockMutate).toHaveBeenCalledWith({
      imageId: "img-1",
      params: { grainIntensity: 50 },
    });
  });

  it("restores params snapshot on mutation failure", async () => {
    useGalleryClientStore.setState({ localParams: { grainIntensity: 10 } });
    mockMutate.mockRejectedValue(new Error("fail"));

    const replaceSpy = vi.spyOn(useGalleryClientStore.getState(), "replaceParams");

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    await vi.waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledWith({ grainIntensity: 10 });
    });

    replaceSpy.mockRestore();
  });

  it("does not call replaceParams on mutation success", async () => {
    mockMutate.mockResolvedValue(undefined);
    const replaceSpy = vi.spyOn(useGalleryClientStore.getState(), "replaceParams");

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    await vi.waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    expect(replaceSpy).not.toHaveBeenCalled();
    replaceSpy.mockRestore();
  });

  it("does not restore params on mutation failure when snapshot is null", async () => {
    mockMutate.mockRejectedValue(new Error("fail"));
    const replaceSpy = vi.spyOn(useGalleryClientStore.getState(), "replaceParams");

    const { result } = renderHook(() => useGalleryUpdateParams());

    act(() => {
      result.current.updateParams("img-1", { grainIntensity: 50 });
    });

    await vi.waitFor(() => {
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    replaceSpy.mockRestore();
  });
});
