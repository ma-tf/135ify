import { Button } from "@components/ui/button";
import { useActiveCard } from "@features/process/active-card-context";
import { useFile } from "@features/process/file-context";
import { cn } from "@lib/utils";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { SlidersIcon, XIcon } from "lucide-react";

export function CardActions() {
  const { activeCardId } = useActiveCard();
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const file = useFile();
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const revokeFileUrls = useFileStore((s) => s.revokeFileUrls);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center gap-2 transition-opacity",
        activeCardId === file.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setOpenSheetId(file.id);
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
          revokeFileUrls(file.id);
          setFiles(files.filter((x) => x.id !== file.id));
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
