import type { FileRecord } from "@stores/file-store-types";

import { StorageContext } from "@providers/storage-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const TEST_FILE: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:test-url",
  params: { ...DEFAULT_PARAMS },
  convexId: null,
  createdAt: Date.now(),
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

const { mockUseMutation } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: mockUseMutation,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSaveToGallery } from "@features/gallery/use-save-to-gallery";

describe("useSaveToGallery", () => {
  const mockGenerateUploadUrl = vi.fn();
  const mockCreateImage = vi.fn();
  const mockRemoveFile = vi.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StorageContext.Provider
      value={{
        files: [],
        addFiles: vi.fn(),
        removeFile: mockRemoveFile,
        updateParams: vi.fn(),
        updateFile: vi.fn(),
        loading: false,
        error: null,
      }}
    >
      {children}
    </StorageContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-123" });
    mockUseMutation.mockReturnValue(mockGenerateUploadUrl);
    mockUseMutation.mockReturnValueOnce(mockGenerateUploadUrl);
    mockUseMutation.mockReturnValueOnce(mockCreateImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it("returns isSaving as false initially", () => {
    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("performs full save flow and shows success toast", async () => {
    const mockOnSuccess = vi.fn();
    mockGenerateUploadUrl.mockResolvedValue("https://upload.url");
    mockCreateImage.mockResolvedValue("image-id-123");

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(["test"])) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ storageId: "st123" }) });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(
      () => useSaveToGallery({ file: TEST_FILE, onSuccess: mockOnSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.save();
    });

    expect(mockGenerateUploadUrl).toHaveBeenCalledWith({});
    expect(mockFetch).toHaveBeenNthCalledWith(1, TEST_FILE.sourceUrl);
    expect(mockFetch).toHaveBeenNthCalledWith(2, "https://upload.url", {
      method: "POST",
      body: expect.any(Blob),
    });
    expect(mockCreateImage).toHaveBeenCalledWith({
      storageId: "st123",
      fileName: "uuid-123",
      params: TEST_FILE.params,
      source: "manual",
    });
    expect(mockRemoveFile).toHaveBeenCalledWith(TEST_FILE.id);
    expect(mockCreateImage).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it("calls toast.success on successful save", async () => {
    mockGenerateUploadUrl.mockResolvedValue("https://upload.url");
    mockCreateImage.mockResolvedValue("image-id-123");

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(["test"])) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ storageId: "st123" }) });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalled();
  });

  it("sets isSaving to true while saving", async () => {
    let resolveUpload: () => void;
    mockGenerateUploadUrl.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveUpload = resolve;
      }),
    );

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    let savePromise: Promise<void>;
    act(() => {
      savePromise = result.current.save();
    });

    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolveUpload!();
      await savePromise;
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("shows error toast when generateUploadUrl fails", async () => {
    mockGenerateUploadUrl.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Failed to save to gallery");
  });

  it("shows error toast when source fetch fails", async () => {
    mockGenerateUploadUrl.mockResolvedValue("https://upload.url");
    const mockFetch = vi.fn().mockRejectedValue(new Error("fetch error"));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Failed to save to gallery");
  });

  it("shows error toast when upload returns non-ok status", async () => {
    mockGenerateUploadUrl.mockResolvedValue("https://upload.url");
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(["test"])) })
      .mockResolvedValueOnce({ ok: false });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Failed to save to gallery");
    expect(mockCreateImage).not.toHaveBeenCalled();
  });

  it("shows error toast when createImage mutation fails", async () => {
    mockGenerateUploadUrl.mockResolvedValue("https://upload.url");
    mockCreateImage.mockRejectedValue(new Error("create failed"));
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(["test"])) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ storageId: "st123" }) });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Failed to save to gallery");
  });

  it("sets isSaving to false after error", async () => {
    mockGenerateUploadUrl.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useSaveToGallery({ file: TEST_FILE, onSuccess: vi.fn() }), {
      wrapper,
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.isSaving).toBe(false);
  });
});
