import type { FileRecord } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useStorage } from "@providers/storage-context";
import { type ReactNode, useEffect, useRef } from "react";
import { toast } from "sonner";

export function EnsureProcessedOrchestrator({
  pendingFiles,
}: {
  pendingFiles: FileRecord[];
}): ReactNode {
  const { updateFile } = useStorage();
  const initiated = useRef(new Set<string>());
  const MAX_DIMENSION = 400;

  useEffect(() => {
    for (const file of pendingFiles) {
      if (file.renderUrl) continue;
      if (file.isProcessing) continue;
      if (!file.sourceUrl) continue;
      if (initiated.current.has(file.id)) continue;
      initiated.current.add(file.id);

      const process = () => {
        if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
        updateFile(file.id, { isProcessing: true, renderUrl: null, renderError: null });

        processToBlobUrl(file.sourceUrl, file.params, MAX_DIMENSION)
          .then((url) => {
            updateFile(file.id, { renderUrl: url, isProcessing: false });
          })
          .catch((err) => {
            console.error("Image processing failed:", err);
            toast.error("Image processing failed");
            const msg = err instanceof Error ? err.message : "Processing failed";
            updateFile(file.id, { renderError: msg, isProcessing: false });
            initiated.current.delete(file.id);
          });
      };

      process();
    }
  }, [pendingFiles, updateFile]);

  return null;
}
