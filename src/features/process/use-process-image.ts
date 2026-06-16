import type { ProcessParams } from "@features/process/process-image";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const params = useFileStore((s) => s.files.find((f) => f.id === fileId)?.params);
  const setRenderResult = useFileStore((s) => s.setRenderResult);
  const setProcessing = useFileStore((s) => s.setProcessing);

  const reprocess = useCallback(
    async (params: ProcessParams) => {
      const file = useFileStore.getState().files.find((f) => f.id === fileId);
      if (!file) return;

      const prevUrl = file.renderUrl;
      setProcessing(fileId, true);
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
    [fileId, setRenderResult, setProcessing],
  );

  const { debounced: reprocessDebounced } = useDebouncedCallback(reprocess, 50);

  const setParam = useCallback(
    (partial: Partial<ProcessParams>) => {
      const current = useFileStore.getState().files.find((f) => f.id === fileId)!.params;
      const merged = { ...current, ...partial };
      useFileStore.getState().updateProcessParams(fileId, partial);
      reprocessDebounced(merged);
    },
    [fileId, reprocessDebounced],
  );

  const downloadFullSize = useCallback(async () => {
    const file = useFileStore.getState().files.find((f) => f.id === fileId);
    if (!file) return null;
    return processToBlobUrl(file.preview, file.params);
  }, [fileId]);

  return { params, setParam, downloadFullSize };
}
