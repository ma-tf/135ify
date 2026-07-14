import type { FileRecord } from "@stores/file-store-types";
import type { ReactNode } from "react";

import { FileProvider } from "@providers/file-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn(),
}));

import { useFileProcessing } from "@features/image/use-file-processing";
import { processToBlobUrl } from "@features/process/process-image";
import { useFileStore } from "@stores/file-store";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";

const fakeFileRecord: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS },
  convexId: null,
  createdAt: Date.now(),
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

function seedFile(file: FileRecord = fakeFileRecord) {
  useFileStore.setState({ files: [file] });
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <TestStorageProvider>
      <FileProvider fileId={fakeFileRecord.id}>{children}</FileProvider>
    </TestStorageProvider>
  );
}

describe("useFileProcessing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(processToBlobUrl).mockResolvedValue("blob:processed-url");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("setParam", () => {
    it("merges partial params and debounces save and process", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      vi.mocked(processToBlobUrl).mockImplementation(
        () =>
          new Promise<string>((r) => {
            resolveProcess = r;
          }),
      );
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      vi.mocked(processToBlobUrl).mockRejectedValue(new Error("GPU unavailable"));
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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
      vi.mocked(processToBlobUrl).mockRejectedValue("something bad");
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
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

    it("revokes old renderUrl before re-processing", async () => {
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      seedFile({ ...fakeFileRecord, renderUrl: "blob:old-render" });
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setParam({ grainIntensity: 50 });
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(revokeSpy).toHaveBeenCalledWith("blob:old-render");
      revokeSpy.mockRestore();
    });
  });

  describe("downloadFullSize", () => {
    it("calls processToBlobUrl with sourceUrl and params", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
      });

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      vi.mocked(processToBlobUrl).mockResolvedValue("blob:fullsize-url");
      await act(async () => {
        await result.current.downloadFullSize(false);
      });

      expect(processToBlobUrl).toHaveBeenCalledWith("blob:preview-url", DEFAULT_PARAMS);
      clickSpy.mockRestore();
    });

    it("downloads original source when showOriginal is true", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
      });

      const fetchSpy = vi
        .fn()
        .mockResolvedValue({ blob: () => Promise.resolve(new Blob(["test"])) });
      vi.stubGlobal("fetch", fetchSpy);
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const createObjSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:download-url");
      const revokeObjSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      await act(async () => {
        await result.current.downloadFullSize(true);
      });

      expect(fetchSpy).toHaveBeenCalledWith("blob:preview-url");
      expect(createObjSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
      createObjSpy.mockRestore();
      revokeObjSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it("does not download when processToBlobUrl returns falsy", async () => {
      seedFile();
      const { result } = renderHook(() => useFileProcessing(), {
        wrapper: Wrapper,
      });

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      vi.mocked(processToBlobUrl).mockResolvedValue("");
      await act(async () => {
        await result.current.downloadFullSize(false);
      });

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  it("throws when used outside FileProvider", () => {
    useFileStore.setState({ files: [fakeFileRecord] });

    expect(() => {
      renderHook(() => useFileProcessing(), {
        wrapper: TestStorageProvider,
      });
    }).toThrow("useFile must be used within FileProvider");
  });
});
