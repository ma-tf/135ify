import type { Id } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useStorage } from "@providers/storage-context";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useSaveToGallery({ file, onSuccess }: { file: FileRecord; onSuccess: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const { removeFile } = useStorage();
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(file.sourceUrl);
      const blob = await response.blob();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
      });
      if (!uploadResult.ok) {
        toast.error("Failed to save to gallery");
        return;
      }
      const { storageId } = (await uploadResult.json()) as { storageId: string };

      const imageId = await createImage({
        storageId: storageId as Id<"_storage">,
        fileName: file.fileName,
        params: file.params,
      });

      removeFile(file.id);

      toast.success(
        <span className="flex gap-1">
          Saved to gallery.
          <Link
            to="/gallery/$imageId"
            params={{ imageId }}
            className="underline underline-offset-2"
          >
            View
          </Link>
        </span>,
      );

      onSuccess();
    } catch (error) {
      toast.error("Failed to save to gallery");
      console.error("Save to gallery failed:", error);
    }
    setIsSaving(false);
  }, [file, generateUploadUrl, createImage, removeFile, onSuccess]);

  return { save, isSaving };
}
