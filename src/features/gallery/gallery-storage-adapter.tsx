import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { useNavigate } from "@tanstack/react-router";
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

  const [file, setFile] = useState<FileRecord | null>(null);

  const queryData = result.status === "success" ? result.data : null;

  useEffect(() => {
    if (queryData) {
      setFile({
        id: queryData._id,
        fileName: queryData.fileName,
        sourceUrl: queryData.sourceUrl ?? "",
        params: {
          ...queryData.params,
          selectedFilmId: queryData.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        },
        createdAt: queryData._creationTime,
        renderUrl: null,
        isProcessing: false,
        renderError: null,
      });
    }
  }, [queryData]);

  useEffect(() => {
    if (result.status === "error" || (result.status === "success" && !queryData)) {
      void navigate({ to: "/gallery" });
    }
  }, [result.status, queryData, navigate]);

  useEffect(() => {
    return () => {
      if (file?.renderUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(file.renderUrl);
      }
    };
  }, [file?.renderUrl]);

  const updateParams = useCallback(
    (id: string, params: Partial<ProcessParams>) => {
      let previousParams: ProcessParams | undefined;
      setFile((prev) => {
        if (!prev) return prev;
        previousParams = prev.params;
        return { ...prev, params: { ...prev.params, ...params } };
      });
      void convexUpdateParams({ imageId: id as Id<"images">, params }).catch(() => {
        const rollback = previousParams;
        if (rollback) {
          setFile((prev) => (prev ? { ...prev, params: rollback } : prev));
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

  const setRenderUrl = useCallback((_id: string, renderUrl: string | null) => {
    setFile((prev) => (prev ? { ...prev, renderUrl } : prev));
  }, []);

  const setProcessing = useCallback((_id: string, isProcessing: boolean) => {
    setFile((prev) => (prev ? { ...prev, isProcessing } : prev));
  }, []);

  const setRenderError = useCallback((_id: string, renderError: string | null) => {
    setFile((prev) => (prev ? { ...prev, renderError } : prev));
  }, []);

  const addFiles = useCallback(() => {
    console.warn("GalleryStorageAdapter does not support adding files");
  }, []);

  const files = file ? [file] : [];
  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);
  const loading = result.status === "pending";
  const error: Error | null = result.status === "error" ? result.error : null;

  const value = useMemo(
    () => ({
      files,
      addFiles,
      removeFile,
      updateParams,
      setRenderUrl,
      setProcessing,
      setRenderError,
      loading,
      error,
    }),
    [
      files,
      addFiles,
      removeFile,
      updateParams,
      setRenderUrl,
      setProcessing,
      setRenderError,
      loading,
      error,
    ],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (result.status === "error")
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        {result.error.message}
      </div>
    );

  if (!file) return null;

  return (
    <StorageContext.Provider value={value}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      {children}
    </StorageContext.Provider>
  );
}
