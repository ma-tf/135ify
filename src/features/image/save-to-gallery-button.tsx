import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { GALLERY_IMAGE_LIMIT } from "@config";
import { api } from "@convex/_generated/api";
import { useSaveToGallery } from "@features/gallery/use-save-to-gallery";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { useAuth } from "@hooks/use-auth";
import { useFile } from "@providers/file-context";
import { useQuery_experimental as useQuery } from "convex/react";
import { ImagePlusIcon } from "lucide-react";

export function SaveToGalleryButton() {
  const { isAuthenticated } = useAuth();
  const file = useFile();
  const onClose = useEditViewClose();
  const gallery = useQuery({ query: api.images.listByUser, args: {} });
  const { save, isSaving } = useSaveToGallery({ file, onSuccess: onClose });

  if (!isAuthenticated) return null;

  const count = gallery?.status === "success" ? gallery.data.length : 0;
  if (count >= GALLERY_IMAGE_LIMIT) return null;

  return (
    <Button disabled={isSaving || file.isProcessing} size="sm" className="gap-1.5" onClick={save}>
      {isSaving ? <Spinner className="size-3.5" /> : <ImagePlusIcon className="size-3.5" />}
      Save to Gallery
    </Button>
  );
}
