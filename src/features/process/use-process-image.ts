import type { ProcessParams } from "@stores/file-store";

import { processToBlobUrl } from "@features/process/process-image";
import { useReprocessImage } from "@features/process/use-reprocess-image";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const files = useFileStore((s) => s.files);
  const updateProcessParams = useFileStore((s) => s.updateProcessParams);

  const file = files.find((f) => f.id === fileId);
  const { reprocessDebounced } = useReprocessImage(fileId);

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
