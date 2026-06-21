import type { FileWithState } from "@stores/file-store";

import { EditSheet } from "@features/process/edit-sheet";
import { useFile } from "@features/process/file-context";
import { PreviewDialog } from "@features/process/preview-dialog";
import { cn } from "@lib/utils";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useState } from "react";

function CardImage({ file }: { file: FileWithState }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <>
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      )}
      <img
        draggable={false}
        src={file.renderUrl ?? file.preview}
        className={cn(
          "h-full w-full object-contain transition-opacity group-hover:scale-105",
          imgLoaded ? "opacity-100" : "opacity-0",
        )}
        alt={file.file.name}
        onLoad={() => setImgLoaded(true)}
      />
    </>
  );
}

export function RenderCard({ className }: { className?: string }) {
  const file = useFile();
  const setImageSrc = useEditSheetStore((s) => s.setImageSrc);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);

  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-3/2 cursor-pointer overflow-hidden bg-amber-700/30 p-0 shadow-[4px_0_0_0_--theme(--color-amber-700/0.4)]",
        className,
      )}
      onClick={() => {
        setImageSrc(file.renderUrl || file.preview);
        setOpenSheetId(file.id);
      }}
    >
      <CardImage file={file} />
      <EditSheet />
      <PreviewDialog />
    </button>
  );
}
