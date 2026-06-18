import { useActiveCard } from "@features/process/active-card-context";
import { CardActions } from "@features/process/card-actions";
import { EditSheet } from "@features/process/edit-sheet";
import { PreviewDialog } from "@features/process/preview-dialog";
import { cn } from "@lib/utils";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { type FileWithState, useFileStore } from "@stores/file-store";
import { useState } from "react";

export function RenderCard({
  fileItem,
  className,
}: {
  fileItem: FileWithState;
  className?: string;
}) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileItem.id)) ?? fileItem;
  const [imgLoaded, setImgLoaded] = useState(false);
  const openSheetId = useEditSheetStore((s) => s.openSheetId);
  const showOriginal = useEditSheetStore((s) => s.showOriginal[fileItem.id] ?? false);
  const { activeCardId, setActiveCardId } = useActiveCard();
  const showActions = activeCardId === fileItem.id;
  const src = showOriginal || !file.renderUrl ? file.preview : file.renderUrl;

  return (
    <div
      className={cn(
        "group relative aspect-3/2 overflow-hidden bg-amber-700/40 shadow-[4px_0_0_0_--theme(--color-amber-700/0.4)]",
        className,
      )}
      onClick={() => {
        if (openSheetId !== fileItem.id)
          setActiveCardId((prev) => (prev === fileItem.id ? null : fileItem.id));
      }}
    >
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      )}
      <img
        src={src}
        className={cn(
          "h-full w-full object-contain transition-all group-hover:scale-105",
          imgLoaded ? "opacity-100" : "opacity-0",
          showActions
            ? "brightness-75 saturate-75"
            : "group-hover:brightness-85 group-hover:saturate-85",
        )}
        alt={file.file.name}
        onLoad={() => setImgLoaded(true)}
      />

      <div
        className={cn(
          "absolute inset-0 bg-black/25 transition-opacity",
          showActions ? "opacity-100" : "opacity-0",
        )}
      />

      <CardActions fileItem={fileItem} />
      <EditSheet fileItem={fileItem} />
      <PreviewDialog fileItem={fileItem} />
    </div>
  );
}
