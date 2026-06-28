import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useEnsureProcessed } from "@features/image/use-ensure-processed";
import { useConvexHydration } from "@hooks/use-convex-hydration";
import { useConvexUpload } from "@hooks/use-convex-upload";
import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { type ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

export default function ConvexStorageProvider({ children }: { children: ReactNode }) {
  const convexImages = useQuery({ query: api.images.listByUser, args: {} });
  const deleteImage = useMutation(api.images.deleteImage);
  const convexUpdateParams = useMutation(api.images.updateParams);

  const { addFiles } = useConvexUpload();

  const storeUpdateParams = useFileStore((s) => s.updateParams);
  const storeRemoveFile = useFileStore((s) => s.removeFile);

  useConvexHydration(convexImages);

  const files = useFileStore((s) => s.files);

  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);

  useEnsureProcessed(pendingFiles);

  const removeFile = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      }
      storeRemoveFile(id);
      try {
        await deleteImage({ imageId: id as Id<"images"> });
      } catch (err) {
        console.error("Convex delete failed:", err);
        toast.error("Failed to delete image");
      }
    },
    [files, storeRemoveFile, deleteImage],
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
