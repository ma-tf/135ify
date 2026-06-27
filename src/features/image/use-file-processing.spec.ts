import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn(),
}));

let processToBlobUrl: ReturnType<typeof vi.fn>;
let useFileStore: typeof import("@stores/file-store").useFileStore;
let useFileProcessing: typeof import("@features/image/use-file-processing").useFileProcessing;
let TestStorageProvider: typeof import("@test-utils/test-storage-provider.spec").TestStorageProvider;

const fakeFileRecord: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS },
  createdAt: Date.now(),
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

function seedFile(file: FileRecord = fakeFileRecord) {
  useFileStore.setState({ files: [file] });
}

describe("useFileProcessing", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const processImageMod = await import("@features/process/process-image");
    processToBlobUrl = vi.mocked(processImageMod.processToBlobUrl);
    processToBlobUrl.mockResolvedValue("blob:processed-url");

    const fileStoreMod = await import("@stores/file-store");
    useFileStore = fileStoreMod.useFileStore;
    useFileStore.setState({ files: [] });

    const hookMod = await import("@features/image/use-file-processing");
    useFileProcessing = hookMod.useFileProcessing;

    const storageMod = await import("@test-utils/test-storage-provider.spec");
    TestStorageProvider = storageMod.TestStorageProvider;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("setParam", () => {
    it("merges partial params and debounces save and process", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(processToBlobUrl).toHaveBeenCalledOnce();
      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", {
        ...DEFAULT_PARAMS,
        grainIntensity: 50,
      });
    });

    it("coalesces rapid successive calls into single trailing edge", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 10 });
      });
      act(() => {
        result.current.setParam({ grainIntensity: 20 });
      });
      act(() => {
        result.current.setParam({ grainIntensity: 30 });
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(processToBlobUrl).toHaveBeenCalledOnce();
      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", {
        ...DEFAULT_PARAMS,
        grainIntensity: 30,
      });
    });

    it("saves params to store after debounce", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ halationIntensity: 75 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      const file = useFileStore.getState().files.find((f) => f.id === "file-1")!;
      expect(file.params.halationIntensity).toBe(75);
    });
  });

  describe("process lifecycle", () => {
    it("sets isProcessing true while processing", async () => {
      let resolveProcess: (v: string) => void;
      processToBlobUrl.mockImplementation(
        () =>
          new Promise<string>((r) => {
            resolveProcess = r;
          }),
      );
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(useFileStore.getState().files.find((f) => f.id === "file-1")!.isProcessing).toBe(true);

      await act(async () => {
        resolveProcess!("blob:done");
      });
    });

    it("sets renderUrl and clears renderError on success", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      const file = useFileStore.getState().files.find((f) => f.id === "file-1")!;
      expect(file.renderUrl).toBe("blob:processed-url");
      expect(file.renderError).toBeNull();
      expect(file.isProcessing).toBe(false);
    });

    it("sets renderError on processing failure", async () => {
      processToBlobUrl.mockRejectedValue(new Error("GPU unavailable"));
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      const file = useFileStore.getState().files.find((f) => f.id === "file-1")!;
      expect(file.renderError).toBe("GPU unavailable");
      expect(file.isProcessing).toBe(false);
    });

    it("falls back to 'Processing failed' for non-Error throws", async () => {
      processToBlobUrl.mockRejectedValue("something bad");
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      const file = useFileStore.getState().files.find((f) => f.id === "file-1")!;
      expect(file.renderError).toBe("Processing failed");
    });
  });

  describe("downloadFullSize", () => {
    it("calls processToBlobUrl with sourceUrl and params", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"), {
        wrapper: TestStorageProvider,
      });

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      processToBlobUrl.mockResolvedValue("blob:fullsize-url");
      await act(async () => {
        await result.current.downloadFullSize();
      });

      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", DEFAULT_PARAMS);
      clickSpy.mockRestore();
    });
  });

  it("throws for unknown fileId", () => {
    useFileStore.setState({ files: [] });

    expect(() => {
      renderHook(() => useFileProcessing("nonexistent"), {
        wrapper: TestStorageProvider,
      });
    }).toThrow("File not found: nonexistent");
  });
});
