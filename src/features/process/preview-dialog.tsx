import { Button } from "@components/ui/button";
import { DialogPortal, DialogOverlay, Dialog } from "@components/ui/dialog";
import { useFileId } from "@features/process/file-context";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

export function PreviewDialog() {
  const fileId = useFileId();
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const inspectUrl = useEditSheetStore((s) => s.inspectUrl);
  const setInspectUrl = useEditSheetStore((s) => s.setInspectUrl);

  return (
    <Dialog open={!!inspectUrl}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-lg" />
        {inspectUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <img
              src={inspectUrl}
              alt={file?.file.name ?? ""}
              className="max-h-[85vh] max-w-[90vw] cursor-pointer border-[1cm] border-white object-contain shadow-lg"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="fixed top-3 left-3 z-60 cursor-pointer"
              onClick={() => setInspectUrl(null)}
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
