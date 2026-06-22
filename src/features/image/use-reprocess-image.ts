import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useRenderStateStore } from "@stores/render-state-store";
import { useCallback } from "react";

export function useReprocessImage(
  fileId: string,
  sourceUrl: string,
  setImageSrc: (url: string) => void,
) {
  const renderStateStore = useRenderStateStore();

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      setImageSrc(sourceUrl);
      renderStateStore.set(fileId, { isProcessing: true, renderUrl: null, renderError: null });

      try {
        const url = await processToBlobUrl(sourceUrl, params);
        setImageSrc(url);
        renderStateStore.set(fileId, { renderUrl: url, isProcessing: false });
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        renderStateStore.set(fileId, { renderError: msg, isProcessing: false });
      }
    },
    [fileId, sourceUrl, renderStateStore, setImageSrc],
  );

  const { debounced: reprocessDebounced } = useDebouncedCallback(reprocess, 50);

  return { reprocess, reprocessDebounced };
}
