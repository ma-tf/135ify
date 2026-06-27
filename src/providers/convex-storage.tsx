import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useEnsureProcessed } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { type ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

export default function ConvexStorageProvider({ children }: { children: ReactNode }) {
  const convexImages = useQuery({ query: api.images.listByUser, args: {} });
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const deleteImage = useMutation(api.images.deleteImage);
  const convexUpdateParams = useMutation(api.images.updateParams);
  const storeFiles = useFileStore((s) => s.files);

  const queryData = convexImages.status === "success" ? convexImages.data : null;

  const files = useMemo(() => {
    if (!queryData) return [];
    return queryData.map((doc): FileRecord => {
      const storeFile = storeFiles.find((f) => f.id === doc._id);
      return {
        id: doc._id as string,
        fileName: doc.fileName,
        sourceUrl: doc.sourceUrl ?? "",
        params: {
          ...doc.params,
          selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        },
        createdAt: doc._creationTime,
        renderUrl: storeFile?.renderUrl ?? null,
        isProcessing: storeFile?.isProcessing ?? false,
        renderError: storeFile?.renderError ?? null,
      };
    });
  }, [queryData, storeFiles]);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      await Promise.all(
        newFiles.map(async (file) => {
          try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (!result.ok) {
              toast.error(`Failed to save "${file.name}" to account`);
              return;
            }
            const { storageId } = (await result.json()) as { storageId: string };
            await createImage({ storageId: storageId as Id<"_storage">, fileName: file.name });
          } catch (err) {
            console.error("Convex upload failed:", err);
            toast.error(`Failed to save "${file.name}" to account`);
          }
        }),
      );
    },
    [generateUploadUrl, createImage],
  );

  const removeFile = useCallback(
    async (id: string) => {
      try {
        await deleteImage({ imageId: id as Id<"images"> });
      } catch (err) {
        console.error("Convex delete failed:", err);
        toast.error("Failed to delete image");
      }
    },
    [deleteImage],
  );

  const updateParams = useCallback(
    (id: string, params: Partial<FileRecord["params"]>) => {
      void convexUpdateParams({ imageId: id as Id<"images">, params });
    },
    [convexUpdateParams],
  );

  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);

  useEnsureProcessed(pendingFiles);

  const loading = convexImages.status === "pending";
  const error: Error | null = convexImages.status === "error" ? convexImages.error : null;

  const value = useMemo(
    () => ({ files, addFiles, removeFile, updateParams, loading, error }),
    [files, addFiles, removeFile, updateParams, loading, error],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
