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
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const file = files.find((x) => x.id === fileItem.id);

  if (!file) return null;

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
          URL.revokeObjectURL(file.preview);
          if (file.renderUrl) {
            URL.revokeObjectURL(file.renderUrl);
          }
          setFiles(files.filter((x) => x.id !== fileItem.id));
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
