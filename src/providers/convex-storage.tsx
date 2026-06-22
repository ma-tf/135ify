import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { StorageContext } from "@providers/storage-context";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { type ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

export function ConvexStorageProvider({ children }: { children: ReactNode }) {
  const convexImages = useQuery({ query: api.images.listByUser, args: {} });
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const deleteImage = useMutation(api.images.deleteImage);
  const convexUpdateParams = useMutation(api.images.updateParams);

  const queryData = convexImages.status === "success" ? convexImages.data : null;

  const files = useMemo(() => {
    if (!queryData) return [];
    return queryData.map(
      (doc): FileRecord => ({
        id: doc._id as string,
        fileName: doc.fileName,
        sourceUrl: doc.sourceUrl ?? "",
        params: {
          ...doc.params,
          selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        },
      }),
    );
  }, [queryData]);

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

  const value = useMemo(
    () => ({ files, addFiles, removeFile, updateParams }),
    [files, addFiles, removeFile, updateParams],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
