import type { ProcessParams } from "@features/process/process-image";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const updateProcessParams = useFileStore((s) => s.updateProcessParams);
  const setRenderResult = useFileStore((s) => s.setRenderResult);

  const file = files.find((f) => f.id === fileId);

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      if (!file) return;

      const prevUrl = file.renderUrl;
      setFiles(files.map((f) => (f.id === fileId ? { ...f, isProcessing: true } : f)));
      setRenderResult(fileId, null, null);
      if (prevUrl) URL.revokeObjectURL(prevUrl);

      try {
        const url = await processToBlobUrl(file.preview, params);
        setRenderResult(fileId, url, null);
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderResult(fileId, null, msg);
      }
    },
    [fileId, file, files, setFiles, updateProcessParams, setRenderResult],
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
