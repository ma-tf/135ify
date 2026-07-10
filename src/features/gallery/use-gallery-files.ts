import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { useQuery_experimental as useQuery } from "convex/react";
import { useEffect, useMemo } from "react";

export function useGalleryFiles(imageId: string) {
  const result = useQuery({
    query: api.images.getById,
    args: { imageId: imageId as Id<"images"> },
  });

  const localParams = useGalleryClientStore((s) => s.localParams);
  const localRenderUrl = useGalleryClientStore((s) => s.localRenderUrl);
  const localIsProcessing = useGalleryClientStore((s) => s.localIsProcessing);
  const localRenderError = useGalleryClientStore((s) => s.localRenderError);
  const clear = useGalleryClientStore((s) => s.clear);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  const queryData = result.status === "success" ? result.data : null;

  const file = useMemo<FileRecord | null>(() => {
    if (!queryData) return null;
    return {
      id: queryData._id,
      fileName: queryData.fileName,
      sourceUrl: queryData.sourceUrl ?? "",
      params: {
        ...queryData.params,
        selectedFilmId: queryData.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        ...localParams,
      },
      convexId: queryData._id,
      createdAt: queryData._creationTime,
      renderUrl: localRenderUrl,
      isProcessing: localIsProcessing,
      renderError: localRenderError,
      size: queryData.size ?? null,
    };
  }, [queryData, localParams, localRenderUrl, localIsProcessing, localRenderError]);

  const files = useMemo(() => (file ? [file] : []), [file]);
  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);
  const loading = result.status === "pending";
  const error: Error | null = result.status === "error" ? result.error : null;

  return { files, pendingFiles, loading, error };
}
