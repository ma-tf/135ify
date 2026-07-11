import type { FileRecord } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { formatBytes, formatTimestamp } from "@lib/utils";
import { useNavigate } from "@tanstack/react-router";

export function GalleryCard({ image }: { image: FileRecord }) {
  const navigate = useNavigate();
  const formattedDate = formatTimestamp(image.createdAt);

  return (
    <button
      type="button"
      tabIndex={0}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-sm bg-card text-left shadow-xl transition hover:ring-2 hover:ring-amber-400/50"
      onClick={() => navigate({ to: "/gallery/$imageId", params: { imageId: image.id } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void navigate({ to: "/gallery/$imageId", params: { imageId: image.id } });
        }
      }}
    >
      <div className="absolute inset-[26%_14%] overflow-hidden rounded-sm bg-amber-700/10 inset-shadow-sm">
        {image.renderUrl ? (
          <img
            src={image.renderUrl}
            alt={image.fileName}
            className="h-full w-full object-contain"
          />
        ) : !image.isProcessing ? (
          <img
            src={image.sourceUrl}
            alt={image.fileName}
            className="h-full w-full object-contain"
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      {image.renderUrl || !image.isProcessing ? (
        <div className="absolute right-0 bottom-0 left-0 px-[14%] pb-[6%]">
          <p className="truncate text-sm font-medium text-foreground/80">{image.fileName}</p>
          <p className="text-xs text-muted-foreground/60">
            {formattedDate}
            {image.size != null && ` · ${formatBytes(image.size)}`}
          </p>
        </div>
      ) : (
        <div className="absolute right-0 bottom-0 left-0 space-y-1 px-[14%] pb-[6%]">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      )}
    </button>
  );
}
