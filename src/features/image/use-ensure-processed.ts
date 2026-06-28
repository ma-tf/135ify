import type { FileRecord } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useStorage } from "@providers/storage-context";
import { type ReactNode, useEffect, useRef } from "react";

export function useEnsureProcessed(files: FileRecord[]): void {
  const { setRenderUrl, setProcessing, setRenderError } = useStorage();
  const initiated = useRef(new Set<string>());

  useEffect(() => {
    for (const file of files) {
      if (file.renderUrl) continue;
      if (file.isProcessing) continue;
      if (!file.sourceUrl) continue;
      if (initiated.current.has(file.id)) continue;
      initiated.current.add(file.id);

      const process = () => {
        setProcessing(file.id, true);
        if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
        setRenderUrl(file.id, null);
        setRenderError(file.id, null);

        processToBlobUrl(file.sourceUrl, file.params)
          .then((url) => {
            setRenderUrl(file.id, url);
            setProcessing(file.id, false);
          })
          .catch((err) => {
            console.error("Image processing failed:", err);
            const msg = err instanceof Error ? err.message : "Processing failed";
            setRenderError(file.id, msg);
            initiated.current.delete(file.id);
            setProcessing(file.id, false);
          });
      };

      process();
    }
  }, [files, setRenderUrl, setProcessing, setRenderError]);
}

export function EnsureProcessedOrchestrator({
  pendingFiles,
}: {
  pendingFiles: FileRecord[];
}): ReactNode {
  useEnsureProcessed(pendingFiles);
  return null;
}
