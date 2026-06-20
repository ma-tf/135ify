import type { FileWithState } from "@stores/file-store";

import { DEFAULT_PARAMS } from "@features/process/process-image";
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
let useReprocessImage: typeof import("./use-reprocess-image").useReprocessImage;

const fakeFile: FileWithState = {
  file: new File([""], "test.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS },
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

function seedFile(file: FileWithState = fakeFile) {
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

    const hookMod = await import("./use-reprocess-image");
    useReprocessImage = hookMod.useReprocessImage;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("reprocess", () => {
    it("calls processToBlobUrl with file preview and params", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

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
      const { result } = renderHook(() => useReprocessImage("file-1"));

      act(() => {
        void result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useFileStore.getState().files[0].isProcessing).toBe(true);

      await act(async () => {
        resolveProcess!("blob:done");
      });
    });

    it("sets renderUrl and clears renderError on success", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      const state = useFileStore.getState();
      expect(state.files[0].renderUrl).toBe("blob:processed-url");
      expect(state.files[0].renderError).toBeNull();
      expect(state.files[0].isProcessing).toBe(false);
    });

    it("calls setImageSrc on success", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useEditSheetStore.getState().imageSrc).toBe("blob:processed-url");
    });

    it("sets renderError on processing failure", async () => {
      processToBlobUrl.mockRejectedValue(new Error("GPU unavailable"));
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      const state = useFileStore.getState();
      expect(state.files[0].renderError).toBe("GPU unavailable");
      expect(state.files[0].isProcessing).toBe(false);
    });

    it("falls back to 'Processing failed' for non-Error throws", async () => {
      processToBlobUrl.mockRejectedValue("something bad");
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(useFileStore.getState().files[0].renderError).toBe("Processing failed");
    });

    it("does not process when file not found", async () => {
      const { result } = renderHook(() => useReprocessImage("nonexistent"));

      await act(async () => {
        await result.current.reprocess(DEFAULT_PARAMS);
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();
    });
  });

  describe("reprocessDebounced", () => {
    it("debounces reprocess calls", async () => {
      seedFile();
      const { result } = renderHook(() => useReprocessImage("file-1"));

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
