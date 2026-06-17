import { Button } from "@components/ui/button";
import { DialogPortal, DialogOverlay, Dialog } from "@components/ui/dialog";
import { useEditActions } from "@features/process/use-edit-actions";
import { type FileWithState, useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

export function PreviewDialog({ fileItem }: { fileItem: FileWithState }) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileItem.id)) ?? fileItem;
  const { previewUrl, setPreviewUrl } = useEditActions(fileItem.id);

  return (
    <Dialog open={!!previewUrl}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-lg" />
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <img
              src={previewUrl}
              alt={file.file.name}
              className="max-h-[85vh] max-w-[90vw] cursor-pointer border-[1cm] border-white object-contain shadow-lg"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="fixed top-3 left-3 z-60 cursor-pointer"
              onClick={() => setPreviewUrl(null)}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        )}
      </DialogPortal>
    </Dialog>
  );
}
