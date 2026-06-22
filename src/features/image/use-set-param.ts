import type { ProcessParams } from "@stores/file-store-types";

import { useReprocessImage } from "@features/image/use-reprocess-image";
import { useStorage } from "@providers/storage-context";
import { useCallback } from "react";

export function useSetParam(
  fileId: string,
  sourceUrl: string,
  params: ProcessParams,
  setImageSrc: (url: string) => void,
) {
  const { updateParams } = useStorage();
  const { reprocessDebounced } = useReprocessImage(fileId, sourceUrl, setImageSrc);

  return useCallback(
    (partial: Partial<ProcessParams>) => {
      const merged = { ...params, ...partial };
      updateParams(fileId, merged);
      reprocessDebounced(merged);
    },
    [fileId, params, updateParams, reprocessDebounced],
  );
}
