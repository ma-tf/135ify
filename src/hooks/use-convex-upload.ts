import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useFileStore } from "@stores/file-store";
import { prepareFiles } from "@stores/prepare-files";
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useConvexUpload() {
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const storeAddFiles = useFileStore((s) => s.addFiles);

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

  return { addFiles };
}
