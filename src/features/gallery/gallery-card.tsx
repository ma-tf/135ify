import type { FileRecord } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { formatTimestamp } from "@lib/utils";
import { useNavigate } from "@tanstack/react-router";

export function GalleryCard({ image }: { image: FileRecord }) {
  const navigate = useNavigate();
  const formattedDate = formatTimestamp(image.createdAt);

  return (
    <button
      type="button"
      tabIndex={0}
      className="cursor-pointer overflow-hidden rounded-lg border text-left transition hover:ring-2"
      onClick={() => navigate({ to: "/gallery/$imageId", params: { imageId: image.id } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void navigate({ to: "/gallery/$imageId", params: { imageId: image.id } });
        }
      }}
    >
      <div className="aspect-square">
        {image.renderUrl ? (
          <img src={image.renderUrl} alt={image.fileName} className="h-full w-full object-cover" />
        ) : !image.isProcessing ? (
          <img src={image.sourceUrl} alt={image.fileName} className="h-full w-full object-cover" />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      <div className="space-y-1 p-3">
        {image.renderUrl || !image.isProcessing ? (
          <>
            <p className="truncate font-medium">{image.fileName}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </>
        ) : (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </>
        )}
      </div>
    </button>
  );
}
