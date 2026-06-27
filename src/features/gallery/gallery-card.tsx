import type { FileRecord } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";

export function GalleryCard({ image }: { image: FileRecord }) {
  const navigate = useNavigate();

  const formattedDate =
    new Date(image.createdAt).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }) + " UTC";

  return (
    <button
      type="button"
      tabIndex={0}
      className="cursor-pointer overflow-hidden rounded-lg border transition hover:ring-2"
      onClick={() => navigate({ to: "/gallery/$imageId", params: { imageId: image.id } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void navigate({ to: "/gallery/$imageId", params: { imageId: image.id } });
        }
      }}
    >
      <div className="aspect-square bg-muted">
        {image.renderUrl ? (
          <img src={image.renderUrl} alt={image.fileName} className="h-full w-full object-cover" />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate font-medium">{image.fileName}</p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </button>
  );
}
