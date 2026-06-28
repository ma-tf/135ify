import type { FileRecord } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useStorage } from "@providers/storage-context";
import { type ReactNode, useEffect, useRef } from "react";

export function useEnsureProcessed(files: FileRecord[], maxDimension?: number): void {
  const { updateFile } = useStorage();
  const initiated = useRef(new Set<string>());

  useEffect(() => {
    for (const file of files) {
      if (file.renderUrl) continue;
      if (file.isProcessing) continue;
      if (!file.sourceUrl) continue;
      if (initiated.current.has(file.id)) continue;
      initiated.current.add(file.id);

      const process = () => {
        if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
        updateFile(file.id, { isProcessing: true, renderUrl: null, renderError: null });

        processToBlobUrl(file.sourceUrl, file.params, maxDimension)
          .then((url) => {
            updateFile(file.id, { renderUrl: url, isProcessing: false });
          })
          .catch((err) => {
            console.error("Image processing failed:", err);
            const msg = err instanceof Error ? err.message : "Processing failed";
            updateFile(file.id, { renderError: msg, isProcessing: false });
            initiated.current.delete(file.id);
          });
      };

      process();
    }
  }, [files, updateFile, maxDimension]);
}

export function EnsureProcessedOrchestrator({
  pendingFiles,
  maxDimension,
}: {
  pendingFiles: FileRecord[];
  maxDimension?: number;
}): ReactNode {
  useEnsureProcessed(pendingFiles, maxDimension);
  return null;
}
