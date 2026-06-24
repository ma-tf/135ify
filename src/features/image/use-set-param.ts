import type { ProcessParams } from "@stores/file-store-types";

import { useReprocessImage } from "@features/image/use-reprocess-image";
import { useDebounce } from "@hooks/use-debounce";
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

  const saveParams = useCallback(
    (merged: ProcessParams) => updateParams(fileId, merged),
    [fileId, updateParams],
  );
  const { debounced: saveParamsDebounced } = useDebounce(saveParams, 200);

  return useCallback(
    (partial: Partial<ProcessParams>) => {
      const merged = { ...params, ...partial };
      saveParamsDebounced(merged);
      reprocessDebounced(merged);
    },
    [fileId, params, saveParamsDebounced, reprocessDebounced],
  );
}
