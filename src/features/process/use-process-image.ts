import type { ProcessParams } from "@features/process/process-image";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const updateProcessParams = useFileStore((s) => s.updateProcessParams);
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

  const setParam = useCallback(
    (partial: Partial<ProcessParams>) => {
      if (!file) return;
      const merged = { ...file.params, ...partial };
      updateProcessParams(fileId, partial);
      reprocessDebounced(merged);
    },
    [fileId, file, updateProcessParams, reprocessDebounced],
  );

  const downloadFullSize = useCallback(async () => {
    if (!file) return null;
    return processToBlobUrl(file.preview, file.params);
  }, [file]);

  return { params: file?.params, setParam, downloadFullSize };
}
