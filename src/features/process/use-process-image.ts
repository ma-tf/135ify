import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useReprocessImage } from "@features/process/use-reprocess-image";
import { useStorage } from "@providers/storage-context";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const { files, updateFile } = useStorage();

  const file = files.find((f) => f.id === fileId);
  const { reprocessDebounced } = useReprocessImage(fileId);

  const setParam = useCallback(
    (partial: Partial<ProcessParams>) => {
      if (!file) return;
      const merged = { ...file.params, ...partial };
      updateFile(fileId, { params: merged });
      reprocessDebounced(merged);
    },
    [fileId, file, updateFile, reprocessDebounced],
  );

  const downloadFullSize = useCallback(async () => {
    if (!file) return null;
    return processToBlobUrl(file.preview, file.params);
  }, [file]);

  return { params: file?.params, setParam, downloadFullSize };
}
