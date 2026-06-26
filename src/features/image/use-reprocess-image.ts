import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebounce } from "@hooks/use-debounce";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useReprocessImage(
  fileId: string,
  sourceUrl: string,
  setImageSrc: (url: string) => void,
) {
  const setRenderUrl = useFileStore((s) => s.setRenderUrl);
  const setProcessing = useFileStore((s) => s.setProcessing);
  const setRenderError = useFileStore((s) => s.setRenderError);

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      setImageSrc(sourceUrl);
      setProcessing(fileId, true);
      setRenderUrl(fileId, null);
      setRenderError(fileId, null);

      try {
        const url = await processToBlobUrl(sourceUrl, params);
        setImageSrc(url);
        setRenderUrl(fileId, url);
        setProcessing(fileId, false);
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderError(fileId, msg);
        setProcessing(fileId, false);
      }
    },
    [fileId, sourceUrl, setRenderUrl, setProcessing, setRenderError, setImageSrc],
  );

  const { debounced: reprocessDebounced } = useDebounce(reprocess, 50);

  return { reprocess, reprocessDebounced };
}
