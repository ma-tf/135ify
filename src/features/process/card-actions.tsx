import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { type FileWithState, useFileStore } from "@stores/file-store";
import { SlidersIcon, XIcon } from "lucide-react";

export function CardActions({
  showActions,
  fileItem,
}: {
  showActions: boolean;
  fileItem: FileWithState;
}) {
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);

  const handleRemove = () => {
    const f = useFileStore.getState().files.find((x) => x.id === fileItem.id);
    if (!f) return;
    if (f.file instanceof File) URL.revokeObjectURL(f.preview);
    if (f.renderUrl) URL.revokeObjectURL(f.renderUrl);
    useFileStore.getState().removeFile(fileItem.id);
  };

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center gap-2 transition-opacity",
        showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setOpenSheetId(fileItem.id);
        }}
        variant="secondary"
        size="icon"
        className="size-8 rounded-full shadow-sm"
      >
        <SlidersIcon className="size-4" />
      </Button>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        variant="secondary"
        size="icon"
        className="size-8 rounded-full shadow-sm"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
