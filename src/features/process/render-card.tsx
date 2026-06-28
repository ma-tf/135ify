import type { FileWithState } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { useCardClick } from "@features/process/card-click-context";
import { cn } from "@lib/utils";
import { useFile } from "@providers/file-context";
import { useState } from "react";

function CardImage({ file }: { file: FileWithState }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!file.renderUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

  return (
    <>
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="size-8 rounded-full" />
        </div>
      )}
      <img
        draggable={false}
        src={file.renderUrl}
        className={cn(
          "h-full w-full object-contain transition-opacity group-hover:scale-105",
          imgLoaded ? "opacity-100" : "opacity-0",
        )}
        alt={file.fileName}
        onLoad={() => setImgLoaded(true)}
      />
    </>
  );
}

export function RenderCard({ className }: { className?: string }) {
  const file = useFile();
  const onCardClick = useCardClick();

  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-3/2 cursor-pointer overflow-hidden bg-amber-700/30 p-0 shadow-[4px_0_0_0_--theme(--color-amber-700/0.4)]",
        className,
      )}
      onClick={(e) => {
        if (e.currentTarget.closest("[data-dragged]")) return;
        onCardClick(file.id);
      }}
    >
      <CardImage file={file} />
    </button>
  );
}
