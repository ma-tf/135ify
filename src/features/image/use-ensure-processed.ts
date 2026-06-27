import type { FileRecord } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useFileStore } from "@stores/file-store";
import { useEffect, useRef } from "react";

export function useEnsureProcessed(files: FileRecord[]): void {
  const setRenderUrl = useFileStore((s) => s.setRenderUrl);
  const setProcessing = useFileStore((s) => s.setProcessing);
  const setRenderError = useFileStore((s) => s.setRenderError);
  const initiated = useRef(new Set<string>());

  useEffect(() => {
    for (const file of files) {
      if (file.renderUrl) continue;
      if (file.isProcessing) continue;
      if (initiated.current.has(file.id)) continue;
      initiated.current.add(file.id);

      const process = () => {
        setProcessing(file.id, true);
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
