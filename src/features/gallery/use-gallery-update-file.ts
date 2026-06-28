import type { FileRecord } from "@stores/file-store-types";

import { useGalleryClientStore } from "@stores/gallery-client-store";
import { useCallback, useEffect } from "react";

export function useGalleryUpdateFile() {
  const setRenderState = useGalleryClientStore((s) => s.setRenderState);
  const localRenderUrl = useGalleryClientStore((s) => s.localRenderUrl);

  useEffect(() => {
    return () => {
      if (localRenderUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(localRenderUrl);
      }
    };
  }, [localRenderUrl]);

  const updateFile = useCallback(
    (
      _id: string,
      update: Partial<Pick<FileRecord, "renderUrl" | "isProcessing" | "renderError">>,
    ) => setRenderState(update),
    [setRenderState],
  );

  return { updateFile };
}
