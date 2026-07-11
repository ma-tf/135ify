import { useGalleryAddFiles } from "@features/gallery/use-gallery-add-files";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("useGalleryAddFiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("returns addFiles function", () => {
    const { result } = renderHook(() => useGalleryAddFiles());

    expect(typeof result.current.addFiles).toBe("function");
  });

  it("logs warning when addFiles is called", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useGalleryAddFiles());

    result.current.addFiles();

    expect(warnSpy).toHaveBeenCalledWith("GalleryStorageAdapter does not support adding files");
  });
});
