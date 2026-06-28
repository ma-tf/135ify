import type { FileRecord } from "@stores/file-store-types";
import type { ReactNode } from "react";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn(),
}));

import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { processToBlobUrl } from "@features/process/process-image";
import { useFileStore } from "@stores/file-store";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";

function baseFile(overrides?: Partial<FileRecord>): FileRecord {
  return {
    id: "file-1",
    fileName: "test.jpg",
    sourceUrl: "blob:preview-url",
    params: { ...DEFAULT_PARAMS },
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  };
}

function seedStore(files: FileRecord[]) {
  useFileStore.setState({ files });
}

function Wrapper({ children }: { children: ReactNode }) {
  return <TestStorageProvider>{children}</TestStorageProvider>;
}

describe("EnsureProcessedOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processToBlobUrl).mockResolvedValue("blob:done");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("skip logic", () => {
    it("skips files that already have a renderUrl", () => {
      seedStore([baseFile({ renderUrl: "blob:existing" })]);
      render(
        <EnsureProcessedOrchestrator pendingFiles={[baseFile({ renderUrl: "blob:existing" })]} />,
        { wrapper: Wrapper },
      );
      expect(processToBlobUrl).not.toHaveBeenCalled();
    });

    it("skips files that are already processing", () => {
      seedStore([baseFile({ isProcessing: true })]);
      render(<EnsureProcessedOrchestrator pendingFiles={[baseFile({ isProcessing: true })]} />, {
        wrapper: Wrapper,
      });
      expect(processToBlobUrl).not.toHaveBeenCalled();
    });

    it("skips files without a sourceUrl", () => {
      seedStore([baseFile({ sourceUrl: "" })]);
      render(<EnsureProcessedOrchestrator pendingFiles={[baseFile({ sourceUrl: "" })]} />, {
        wrapper: Wrapper,
      });
      expect(processToBlobUrl).not.toHaveBeenCalled();
    });

    it("deduplicates: processes same file ID only once per effect run", () => {
      const file = baseFile();
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file, file]} />, { wrapper: Wrapper });
      expect(processToBlobUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("processing lifecycle", () => {
    it("sets isProcessing true and clears renderUrl/renderError before processing", () => {
      vi.mocked(processToBlobUrl).mockImplementation(() => new Promise(() => {}));
      const file = baseFile({ renderError: "old error" });
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });
      const stored = useFileStore.getState().files[0];
      expect(stored.isProcessing).toBe(true);
      expect(stored.renderUrl).toBeNull();
      expect(stored.renderError).toBeNull();
    });

    it("sets renderUrl and clears isProcessing on success", async () => {
      vi.mocked(processToBlobUrl).mockResolvedValue("blob:done");
      const file = baseFile();
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        const stored = useFileStore.getState().files[0];
        expect(stored.renderUrl).toBe("blob:done");
        expect(stored.isProcessing).toBe(false);
      });
    });

    it("sets renderError and clears isProcessing on failure", async () => {
      vi.mocked(processToBlobUrl).mockRejectedValue(new Error("GPU unavailable"));
      const file = baseFile();
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        const stored = useFileStore.getState().files[0];
        expect(stored.renderError).toBe("GPU unavailable");
        expect(stored.isProcessing).toBe(false);
      });
    });

    it("falls back to 'Processing failed' for non-Error throws", async () => {
      vi.mocked(processToBlobUrl).mockRejectedValue("something bad");
      const file = baseFile();
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        const stored = useFileStore.getState().files[0];
        expect(stored.renderError).toBe("Processing failed");
      });
    });

    it("allows retry after failure by removing file from initiated set", async () => {
      vi.mocked(processToBlobUrl).mockRejectedValue(new Error("GPU unavailable"));
      const file = baseFile();
      seedStore([file]);

      const { rerender } = render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });

      await vi.waitFor(() => {
        const stored = useFileStore.getState().files[0];
        expect(stored.renderError).toBe("GPU unavailable");
      });

      vi.mocked(processToBlobUrl).mockResolvedValue("blob:retry");

      rerender(<EnsureProcessedOrchestrator pendingFiles={[{ ...file }]} />);

      await vi.waitFor(() => {
        const stored = useFileStore.getState().files[0];
        expect(stored.renderUrl).toBe("blob:retry");
      });
    });
  });

  describe("failure logging", () => {
    it("logs to console.error on failure", async () => {
      const error = new Error("GPU unavailable");
      vi.mocked(processToBlobUrl).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const file = baseFile();
      seedStore([file]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Image processing failed:", error);
      });
    });
  });

  describe("multi-file", () => {
    it("processes multiple pending files", async () => {
      vi.mocked(processToBlobUrl).mockResolvedValue("blob:done");
      const file1 = baseFile({ id: "file-1" });
      const file2 = baseFile({ id: "file-2" });
      seedStore([file1, file2]);
      render(<EnsureProcessedOrchestrator pendingFiles={[file1, file2]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        expect(processToBlobUrl).toHaveBeenCalledTimes(2);
      });
    });

    it("skips processed files while processing unprocessed ones", async () => {
      vi.mocked(processToBlobUrl).mockResolvedValue("blob:done");
      const done = baseFile({ id: "file-1", renderUrl: "blob:existing" });
      const pending = baseFile({ id: "file-2" });
      seedStore([done, pending]);
      render(<EnsureProcessedOrchestrator pendingFiles={[done, pending]} />, {
        wrapper: Wrapper,
      });
      await vi.waitFor(() => {
        expect(processToBlobUrl).toHaveBeenCalledTimes(1);
        expect(processToBlobUrl).toHaveBeenCalledWith(pending.sourceUrl, pending.params, 400);
      });
    });
  });

  describe("edge cases", () => {
    it("does nothing with an empty files array", () => {
      seedStore([]);
      render(<EnsureProcessedOrchestrator pendingFiles={[]} />, {
        wrapper: Wrapper,
      });
      expect(processToBlobUrl).not.toHaveBeenCalled();
    });
  });

  it("renders null", () => {
    const { container } = render(<EnsureProcessedOrchestrator pendingFiles={[]} />, {
      wrapper: Wrapper,
    });
    expect(container.innerHTML).toBe("");
  });
});
