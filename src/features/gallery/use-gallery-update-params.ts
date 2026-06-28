import type { Id } from "@convex/_generated/dataModel";
import type { ProcessParams } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { useMutation } from "convex/react";
import { useCallback } from "react";

export function useGalleryUpdateParams() {
  const convexUpdateParams = useMutation(api.images.updateParams);
  const mergeParamsWithSnapshot = useGalleryClientStore((s) => s.mergeParamsWithSnapshot);
  const replaceParams = useGalleryClientStore((s) => s.replaceParams);

  const updateParams = useCallback(
    (id: string, params: Partial<ProcessParams>) => {
      const snapshot = mergeParamsWithSnapshot(params);
      void convexUpdateParams({ imageId: id as Id<"images">, params }).catch(() => {
        if (snapshot !== null) replaceParams(snapshot);
      });
    },
    [convexUpdateParams, mergeParamsWithSnapshot, replaceParams],
  );

  return { updateParams };
}
