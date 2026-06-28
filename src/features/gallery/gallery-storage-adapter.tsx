import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

export function GalleryStorageAdapter({
  imageId,
  children,
}: {
  imageId: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const result = useQuery({
    query: api.images.getById,
    args: { imageId: imageId as Id<"images"> },
  });
  const convexUpdateParams = useMutation(api.images.updateParams);
  const convexDeleteImage = useMutation(api.images.deleteImage);

  const queryData = result.status === "success" ? result.data : null;

  const [localParams, setLocalParams] = useState<Partial<ProcessParams> | null>(null);
  const [localRenderUrl, setLocalRenderUrl] = useState<string | null>(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const [localRenderError, setLocalRenderError] = useState<string | null>(null);

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
      createdAt: queryData._creationTime,
      renderUrl: localRenderUrl,
      isProcessing: localIsProcessing,
      renderError: localRenderError,
    };
  }, [queryData, localParams, localRenderUrl, localIsProcessing, localRenderError]);

  useEffect(() => {
    return () => {
      if (localRenderUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(localRenderUrl);
      }
    };
  }, [localRenderUrl]);

  const updateParams = useCallback(
    (id: string, params: Partial<ProcessParams>) => {
      let previousParams: Partial<ProcessParams> | null = null;
      setLocalParams((prev) => {
        previousParams = prev;
        return { ...prev, ...params };
      });
      void convexUpdateParams({ imageId: id as Id<"images">, params }).catch(() => {
        if (previousParams !== null) {
          setLocalParams(previousParams);
        }
      });
    },
    [convexUpdateParams],
  );

  const removeFile = useCallback(
    async (id: string) => {
      try {
        await convexDeleteImage({ imageId: id as Id<"images"> });
        void navigate({ to: "/gallery" });
      } catch {
        console.error("Failed to delete image", id);
      }
    },
    [convexDeleteImage, navigate],
  );

  const updateFile = useCallback(
    (
      _id: string,
      update: Partial<Pick<FileRecord, "renderUrl" | "isProcessing" | "renderError">>,
    ) => {
      if ("renderUrl" in update) setLocalRenderUrl(update.renderUrl!);
      if ("isProcessing" in update) setLocalIsProcessing(update.isProcessing!);
      if ("renderError" in update) setLocalRenderError(update.renderError!);
    },
    [],
  );

  const addFiles = useCallback(() => {
    console.warn("GalleryStorageAdapter does not support adding files");
  }, []);

  const files = useMemo(() => (file ? [file] : []), [file]);
  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);
  const loading = result.status === "pending";
  const error: Error | null = result.status === "error" ? result.error : null;

  const value = useMemo(
    () => ({
      files,
      addFiles,
      removeFile,
      updateParams,
      updateFile,
      loading,
      error,
    }),
    [files, addFiles, removeFile, updateParams, updateFile, loading, error],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (result.status === "error" || (result.status === "success" && !queryData)) {
    return <Navigate to="/gallery" />;
  }

  if (!file) return null;

  return (
    <StorageContext.Provider value={value}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      {children}
    </StorageContext.Provider>
  );
}
