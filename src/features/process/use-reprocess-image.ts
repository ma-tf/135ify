import type { ProcessParams } from "@stores/file-store";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useReprocessImage(fileId: string) {
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const revokeFileUrls = useFileStore((s) => s.revokeFileUrls);
  const setImageSrc = useEditSheetStore((s) => s.setImageSrc);

  const file = files.find((f) => f.id === fileId);

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      if (!file) return;

      revokeFileUrls(fileId);
      setImageSrc(file.preview);
      setFiles(
        files.map((f) =>
          f.id === fileId ? { ...f, isProcessing: true, renderUrl: null, renderError: null } : f,
        ),
      );

      try {
        const url = await processToBlobUrl(file.preview, params);
        setImageSrc(url);
        setFiles(
          files.map((f) => (f.id === fileId ? { ...f, renderUrl: url, isProcessing: false } : f)),
        );
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        setFiles(
          files.map((f) => (f.id === fileId ? { ...f, renderError: msg, isProcessing: false } : f)),
        );
      }
    },
    [fileId, file, files, setFiles, revokeFileUrls, setImageSrc],
  );

  const { debounced: reprocessDebounced } = useDebouncedCallback(reprocess, 50);

  return { reprocess, reprocessDebounced };
}
