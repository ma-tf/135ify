import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/process-image", () => ({
  DEFAULT_PARAMS: {
    selectedFilmId: "default",
    halationIntensity: 0,
    halationSpread: 0,
    halationThreshold: 0,
    vignetteIntensity: 0,
    vignetteFeather: 0,
    grainIntensity: 0,
  },
  processToBlobUrl: vi.fn(),
}));

let processToBlobUrl: ReturnType<typeof vi.fn>;
let useFileStore: typeof import("@stores/file-store").useFileStore;
let useEditSheetStore: typeof import("@stores/edit-sheet-store").useEditSheetStore;
let useRenderStateStore: typeof import("@stores/render-state-store").useRenderStateStore;
let useReprocessImage: typeof import("./use-reprocess-image").useReprocessImage;
let TestStorageProvider: typeof import("@test-utils/test-storage-provider.spec").TestStorageProvider;

const fakeFileRecord: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS },
};

function seedFile(file: FileRecord = fakeFileRecord) {
  useFileStore.setState({ files: [file] });
}

describe("useReprocessImage", () => {
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

    const editSheetMod = await import("@stores/edit-sheet-store");
    useEditSheetStore = editSheetMod.useEditSheetStore;
    useEditSheetStore.setState({ imageSrc: "" });

    const renderStateMod = await import("@stores/render-state-store");
    useRenderStateStore = renderStateMod.useRenderStateStore;
    useRenderStateStore.setState({ states: {} });

    const hookMod = await import("./use-reprocess-image");
    useReprocessImage = hookMod.useReprocessImage;

    const storageMod = await import("@test-utils/test-storage-provider.spec");
    TestStorageProvider = storageMod.TestStorageProvider;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("reprocess", () => {
    it("calls processToBlobUrl with sourceUrl and params", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", DEFAULT_PARAMS);
    });

    it("sets isProcessing true while processing", async () => {
      let resolveProcess: (v: string) => void;
      processToBlobUrl.mockImplementation(
        () =>
          new Promise<string>((r) => {
            resolveProcess = r;
          }),
      );
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        void result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useRenderStateStore.getState().get("file-1").isProcessing).toBe(true);

      await act(async () => {
        resolveProcess!("blob:done");
      });
    });

    it("sets renderUrl and clears renderError on success", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      const state = useRenderStateStore.getState().get("file-1");
      expect(state.renderUrl).toBe("blob:processed-url");
      expect(state.renderError).toBeNull();
      expect(state.isProcessing).toBe(false);
    });

    it("calls setImageSrc on success", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useEditSheetStore.getState().imageSrc).toBe("blob:processed-url");
    });

    it("sets renderError on processing failure", async () => {
      processToBlobUrl.mockRejectedValue(new Error("GPU unavailable"));
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      const state = useRenderStateStore.getState().get("file-1");
      expect(state.renderError).toBe("GPU unavailable");
      expect(state.isProcessing).toBe(false);
    });

    it("falls back to 'Processing failed' for non-Error throws", async () => {
      processToBlobUrl.mockRejectedValue("something bad");
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useRenderStateStore.getState().get("file-1").renderError).toBe("Processing failed");
    });
  });

  describe("reprocessDebounced", () => {
    it("debounces reprocess calls", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1", "blob:preview-url"), {
        wrapper: TestStorageProvider,
      });

      act(() => {
        result.current.reprocessDebounced(DEFAULT_PARAMS);
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(processToBlobUrl).toHaveBeenCalledOnce();
    });
  });
});
