import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn(),
}));

let processToBlobUrl: ReturnType<typeof vi.fn>;
let useFileStore: typeof import("@stores/file-store").useFileStore;
let useEnsureProcessed: typeof import("@features/image/use-ensure-processed").useEnsureProcessed;
let TestStorageProvider: typeof import("@test-utils/test-storage-provider.spec").TestStorageProvider;

const pendingFile: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS },
  createdAt: Date.now(),
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

const processedFile: FileRecord = {
  ...pendingFile,
  id: "file-2",
  renderUrl: "blob:existing",
};

const processingFile: FileRecord = {
  ...pendingFile,
  id: "file-3",
  isProcessing: true,
};

describe("useEnsureProcessed", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const processImageMod = await import("@features/process/process-image");
    processToBlobUrl = vi.mocked(processImageMod.processToBlobUrl);
    processToBlobUrl.mockResolvedValue("blob:processed-url");

    const fileStoreMod = await import("@stores/file-store");
    useFileStore = fileStoreMod.useFileStore;
    useFileStore.setState({ files: [] });

    const hookMod = await import("@features/image/use-ensure-processed");
    useEnsureProcessed = hookMod.useEnsureProcessed;

    const storageMod = await import("@test-utils/test-storage-provider.spec");
    TestStorageProvider = storageMod.TestStorageProvider;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("processes a pending file", () => {
    useFileStore.setState({ files: [pendingFile] });

    renderHook(() => useEnsureProcessed([pendingFile]), {
      wrapper: TestStorageProvider,
    });

    expect(processToBlobUrl).toHaveBeenCalledOnce();
    expect(processToBlobUrl).toHaveBeenCalledWith(pendingFile.sourceUrl, pendingFile.params);
  });

  it("skips file with renderUrl", () => {
    useFileStore.setState({ files: [processedFile] });

    renderHook(() => useEnsureProcessed([processedFile]), {
      wrapper: TestStorageProvider,
    });

    expect(processToBlobUrl).not.toHaveBeenCalled();
  });

  it("skips file that is already processing", () => {
    useFileStore.setState({ files: [processingFile] });

    renderHook(() => useEnsureProcessed([processingFile]), {
      wrapper: TestStorageProvider,
    });

    expect(processToBlobUrl).not.toHaveBeenCalled();
  });

  it("processes multiple pending files", () => {
    const file1 = { ...pendingFile, id: "a" };
    const file2 = { ...pendingFile, id: "b" };
    useFileStore.setState({ files: [file1, file2] });

    renderHook(() => useEnsureProcessed([file1, file2]), {
      wrapper: TestStorageProvider,
    });

    expect(processToBlobUrl).toHaveBeenCalledTimes(2);
  });

  it("sets isProcessing before and after processing", async () => {
    let resolveProcess: (v: string) => void;
    processToBlobUrl.mockImplementation(
      () =>
        new Promise<string>((r) => {
          resolveProcess = r;
        }),
    );
    useFileStore.setState({ files: [pendingFile] });

    renderHook(() => useEnsureProcessed([pendingFile]), {
      wrapper: TestStorageProvider,
    });

    expect(useFileStore.getState().files[0].isProcessing).toBe(true);

    await act(async () => {
      resolveProcess!("blob:done");
    });

    expect(useFileStore.getState().files[0].isProcessing).toBe(false);
  });

  it("sets renderUrl on success", async () => {
    useFileStore.setState({ files: [pendingFile] });

    renderHook(() => useEnsureProcessed([pendingFile]), {
      wrapper: TestStorageProvider,
    });

    await act(async () => {});

    const file = useFileStore.getState().files[0];
    expect(file.renderUrl).toBe("blob:processed-url");
    expect(file.renderError).toBeNull();
    expect(file.isProcessing).toBe(false);
  });

  it("sets renderError on failure", async () => {
    processToBlobUrl.mockRejectedValue(new Error("GPU unavailable"));
    useFileStore.setState({ files: [pendingFile] });

    renderHook(() => useEnsureProcessed([pendingFile]), {
      wrapper: TestStorageProvider,
    });

    await act(async () => {});

    const file = useFileStore.getState().files[0];
    expect(file.renderError).toBe("GPU unavailable");
    expect(file.renderUrl).toBeNull();
    expect(file.isProcessing).toBe(false);
  });

  it("uses 'Processing failed' fallback for non-Error throws", async () => {
    processToBlobUrl.mockRejectedValue("something bad");
    useFileStore.setState({ files: [pendingFile] });

    renderHook(() => useEnsureProcessed([pendingFile]), {
      wrapper: TestStorageProvider,
    });

    await act(async () => {});

    const file = useFileStore.getState().files[0];
    expect(file.renderError).toBe("Processing failed");
    expect(file.isProcessing).toBe(false);
  });

  it("is a no-op for empty array", () => {
    renderHook(() => useEnsureProcessed([]), {
      wrapper: TestStorageProvider,
    });

    expect(processToBlobUrl).not.toHaveBeenCalled();
  });
});
