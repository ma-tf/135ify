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
let useFileProcessing: typeof import("./use-process-image").useFileProcessing;

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

    const editSheetMod = await import("@stores/edit-sheet-store");
    useEditSheetStore = editSheetMod.useEditSheetStore;
    useEditSheetStore.setState({ imageSrc: "" });

    const hookMod = await import("./use-process-image");
    useFileProcessing = hookMod.useFileProcessing;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("reprocess (via setParam)", () => {
    it("calls processToBlobUrl with the file preview and merged params", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", {
        ...DEFAULT_PARAMS,
        grainIntensity: 5,
      });
    });

    it("sets isProcessing true while processing", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      act(() => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      const state = useFileStore.getState();
      expect(state.files[0].isProcessing).toBe(true);
    });

    it("sets renderUrl and clears renderError on success", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      const state = useFileStore.getState();
      expect(state.files[0].renderUrl).toBe("blob:processed-url");
      expect(state.files[0].renderError).toBeNull();
      expect(state.files[0].isProcessing).toBe(false);
    });

    it("calls setImageSrc on success", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      expect(useEditSheetStore.getState().imageSrc).toBe("blob:processed-url");
    });

    it("calls revokeFileUrls before processing", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      const revokeSpy = vi.spyOn(useFileStore.getState(), "revokeFileUrls");
      expect(revokeSpy).toBeDefined();
    });

    it("sets renderError on processing failure", async () => {
      processToBlobUrl.mockRejectedValue(new Error("GPU unavailable"));
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      const state = useFileStore.getState();
      expect(state.files[0].renderError).toBe("GPU unavailable");
      expect(state.files[0].isProcessing).toBe(false);
    });

    it("falls back to 'Processing failed' for non-Error throws", async () => {
      processToBlobUrl.mockRejectedValue("something bad");
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      const state = useFileStore.getState();
      expect(state.files[0].renderError).toBe("Processing failed");
    });

    it("does not process when file not found", async () => {
      const { result } = renderHook(() => useFileProcessing("nonexistent"));

      await act(async () => {
        result.current.setParam({ grainIntensity: 5 });
        vi.advanceTimersByTime(50);
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();
    });
  });

  describe("setParam", () => {
    it("merges partial into file params via updateProcessParams", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      act(() => {
        result.current.setParam({ grainIntensity: 5 });
      });

      const state = useFileStore.getState();
      expect(state.files[0].params.grainIntensity).toBe(5);
    });

    it("triggers debounced reprocess with merged params", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      act(() => {
        result.current.setParam({ grainIntensity: 5 });
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(processToBlobUrl).toHaveBeenCalledOnce();
    });

    it("does nothing when file not found", async () => {
      const { result } = renderHook(() => useFileProcessing("nonexistent"));

      act(() => {
        result.current.setParam({ grainIntensity: 5 });
      });

      expect(processToBlobUrl).not.toHaveBeenCalled();
    });
  });

  describe("downloadFullSize", () => {
    it("returns processToBlobUrl result with file preview and params", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      const url = await result.current.downloadFullSize();

      expect(url).toBe("blob:processed-url");
      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", DEFAULT_PARAMS);
    });

    it("returns null when file not found", async () => {
      const { result } = renderHook(() => useFileProcessing("nonexistent"));

      const url = await result.current.downloadFullSize();

      expect(url).toBeNull();
    });
  });

  describe("params return value", () => {
    it("returns file params when file exists", () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing("file-1"));

      expect(result.current.params).toEqual(DEFAULT_PARAMS);
    });

    it("returns undefined when file not found", () => {
      const { result } = renderHook(() => useFileProcessing("nonexistent"));

      expect(result.current.params).toBeUndefined();
    });
  });
});
