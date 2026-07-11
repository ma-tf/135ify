import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseMutation, mockNavigate } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: mockUseMutation,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

import { useGalleryRemoveFile } from "@features/gallery/use-gallery-remove-file";

describe("useGalleryRemoveFile", () => {
  const mockDeleteImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockDeleteImage);
  });

  afterEach(() => {
    cleanup();
  });

  it("calls convexDeleteImage mutation with correct imageId", async () => {
    mockDeleteImage.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGalleryRemoveFile());

    await act(async () => {
      await result.current.removeFile("img-1");
    });

    expect(mockDeleteImage).toHaveBeenCalledWith({ imageId: "img-1" });
  });

  it("navigates to /gallery after successful deletion", async () => {
    mockDeleteImage.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGalleryRemoveFile());

    await act(async () => {
      await result.current.removeFile("img-1");
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/gallery" });
  });

  it("does not navigate on mutation error", async () => {
    mockDeleteImage.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useGalleryRemoveFile());

    await act(async () => {
      await result.current.removeFile("img-1");
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("logs error on mutation failure", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteImage.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useGalleryRemoveFile());

    await act(async () => {
      await result.current.removeFile("img-1");
    });

    expect(errorSpy).toHaveBeenCalledWith("Failed to delete image", "img-1");
    errorSpy.mockRestore();
  });
});
