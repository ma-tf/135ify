import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useEnsureProcessed } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { prepareFiles } from "@stores/prepare-files";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export default function ConvexStorageProvider({ children }: { children: ReactNode }) {
  const convexImages = useQuery({ query: api.images.listByUser, args: {} });
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const deleteImage = useMutation(api.images.deleteImage);
  const convexUpdateParams = useMutation(api.images.updateParams);

  const storeFiles = useFileStore((s) => s.files);
  const storeAddFiles = useFileStore((s) => s.addFiles);
  const storeUpdateParams = useFileStore((s) => s.updateParams);
  const storeRemoveFile = useFileStore((s) => s.removeFile);
  const storeFilesRef = useRef(storeFiles);
  storeFilesRef.current = storeFiles;

  const queryData = convexImages.status === "success" ? convexImages.data : null;

  // Hydrate store from Convex query results
  useEffect(() => {
    if (!queryData) return;
    const current = storeFilesRef.current;

    const records = queryData.map((doc): FileRecord => {
      const existing = current.find((f) => f.id === doc._id);
      return {
        id: doc._id as string,
        fileName: doc.fileName,
        sourceUrl: doc.sourceUrl ?? "",
        params: {
          ...doc.params,
          selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        },
        createdAt: doc._creationTime,
        renderUrl: existing?.renderUrl ?? null,
        isProcessing: existing?.isProcessing ?? false,
        renderError: existing?.renderError ?? null,
      };
    });

    useFileStore.setState({ files: records });
  }, [queryData]);

  const files = storeFiles;

  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);

  useEnsureProcessed(pendingFiles);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const { valid, records } = prepareFiles(newFiles);
      if (valid.length === 0) return;

      storeAddFiles(records);

      await Promise.all(
        valid.map(async (file) => {
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
    [generateUploadUrl, createImage, storeAddFiles],
  );

  const removeFile = useCallback(
    async (id: string) => {
      storeRemoveFile(id);
      try {
        await deleteImage({ imageId: id as Id<"images"> });
      } catch (err) {
        console.error("Convex delete failed:", err);
        toast.error("Failed to delete image");
      }
    },
    [storeRemoveFile, deleteImage],
  );

  const updateParams = useCallback(
    (id: string, params: Partial<FileRecord["params"]>) => {
      storeUpdateParams(id, params);
      void convexUpdateParams({ imageId: id as Id<"images">, params });
    },
    [storeUpdateParams, convexUpdateParams],
  );

  const loading = convexImages.status === "pending";
  const error: Error | null = convexImages.status === "error" ? convexImages.error : null;

  const value = useMemo(
    () => ({ files, addFiles, removeFile, updateParams, loading, error }),
    [files, addFiles, removeFile, updateParams, loading, error],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
