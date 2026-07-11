import { useGalleryUpdateFile } from "@features/gallery/use-gallery-update-file";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("useGalleryUpdateFile", () => {
  let revokeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });
    useGalleryClientStore.setState({
      localParams: null,
      localRenderUrl: null,
      localIsProcessing: false,
      localRenderError: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it("updateFile calls setRenderState and updates localRenderUrl", () => {
    const { result } = renderHook(() => useGalleryUpdateFile());

    act(() => {
      result.current.updateFile("x", { renderUrl: "blob:rendered" });
    });

    expect(useGalleryClientStore.getState().localRenderUrl).toBe("blob:rendered");
  });

  it("updateFile updates isProcessing", () => {
    const { result } = renderHook(() => useGalleryUpdateFile());

    act(() => {
      result.current.updateFile("x", { isProcessing: true });
    });

    expect(useGalleryClientStore.getState().localIsProcessing).toBe(true);
  });

  it("updateFile updates renderError", () => {
    const { result } = renderHook(() => useGalleryUpdateFile());

    act(() => {
      result.current.updateFile("x", { renderError: "error occurred" });
    });

    expect(useGalleryClientStore.getState().localRenderError).toBe("error occurred");
  });

  it("revokes blob URL on unmount when localRenderUrl is a blob URL", () => {
    const { result, unmount } = renderHook(() => useGalleryUpdateFile());

    act(() => {
      result.current.updateFile("x", { renderUrl: "blob:rendered" });
    });

    unmount();

    expect(revokeSpy).toHaveBeenCalledWith("blob:rendered");
  });

  it("does not revoke when localRenderUrl is null", () => {
    const { unmount } = renderHook(() => useGalleryUpdateFile());

    unmount();

    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it("does not revoke when localRenderUrl is not a blob URL", () => {
    const { result, unmount } = renderHook(() => useGalleryUpdateFile());

    act(() => {
      result.current.updateFile("x", { renderUrl: "https://example.com/image.jpg" });
    });

    unmount();

    expect(revokeSpy).not.toHaveBeenCalled();
  });
});
