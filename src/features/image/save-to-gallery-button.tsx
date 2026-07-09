import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
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
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });
  const { save, isSaving } = useSaveToGallery({ file, onSuccess: onClose });

  if (!isAuthenticated) return null;
  if (file.convexId) return null;

  const atLimit = storageResult.status === "success" && storageResult.data.atLimit;

  return (
    <Button
      disabled={isSaving || file.isProcessing || atLimit}
      size="sm"
      className="gap-1.5"
      onClick={save}
    >
      {isSaving ? <Spinner className="size-3.5" /> : <ImagePlusIcon className="size-3.5" />}
      Save to Gallery
    </Button>
  );
}
