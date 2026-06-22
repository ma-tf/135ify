import type { ProcessParams } from "@stores/file-store-types";

import { useReprocessImage } from "@features/process/use-reprocess-image";
import { useStorage } from "@providers/storage-context";
import { useCallback } from "react";

export function useSetParam(fileId: string, sourceUrl: string, params: ProcessParams) {
  const { updateParams } = useStorage();
  const { reprocessDebounced } = useReprocessImage(fileId, sourceUrl);

  return useCallback(
    (partial: Partial<ProcessParams>) => {
      const merged = { ...params, ...partial };
      updateParams(fileId, merged);
      reprocessDebounced(merged);
    },
    [fileId, params, updateParams, reprocessDebounced],
  );
}
