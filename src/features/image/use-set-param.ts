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
  const { reprocess } = useReprocessImage(fileId, sourceUrl, setImageSrc);

  const { debounced: saveParamsDebounced } = useDebounce(
    (merged: ProcessParams) => updateParams(fileId, merged),
    100,
  );

  const { debounced: reprocessDebounced } = useDebounce(reprocess, 200);

  return useCallback(
    (partial: Partial<ProcessParams>) => {
      const merged = { ...params, ...partial };
      saveParamsDebounced(merged);
      reprocessDebounced(merged);
    },
    [params, saveParamsDebounced, reprocessDebounced],
  );
}
