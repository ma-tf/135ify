import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback } from "react";

export function useGalleryRemoveFile() {
  const convexDeleteImage = useMutation(api.images.deleteImage);
  const navigate = useNavigate();

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

  return { removeFile };
}
