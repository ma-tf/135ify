import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useStorage } from "@providers/storage-context";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useCallback } from "react";

export function useReprocessImage(fileId: string) {
  const { files, updateFile } = useStorage();
  const setImageSrc = useEditSheetStore((s) => s.setImageSrc);

  const file = files.find((f) => f.id === fileId);

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      if (!file) return;

      setImageSrc(file.preview);
      updateFile(fileId, { isProcessing: true, renderUrl: null, renderError: null });

      try {
        const url = await processToBlobUrl(file.preview, params);
        setImageSrc(url);
        updateFile(fileId, { renderUrl: url, isProcessing: false });
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        updateFile(fileId, { renderError: msg, isProcessing: false });
      }
    },
    [fileId, file, updateFile, setImageSrc],
  );

  const { debounced: reprocessDebounced } = useDebouncedCallback(reprocess, 50);

  return { reprocess, reprocessDebounced };
}
