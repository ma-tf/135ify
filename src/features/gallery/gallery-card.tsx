import type { Doc } from "@convex/_generated/dataModel";

import { useNavigate } from "@tanstack/react-router";

type GalleryImage = Doc<"images"> & { sourceUrl: string | null };

export function GalleryCard({ image }: { image: GalleryImage }) {
  const navigate = useNavigate();

  const formattedDate =
    new Date(image._creationTime).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }) + " UTC";

  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer overflow-hidden rounded-lg border transition hover:ring-2"
      onClick={() => navigate({ to: "/gallery/$imageId", params: { imageId: image._id } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void navigate({ to: "/gallery/$imageId", params: { imageId: image._id } });
        }
      }}
    >
      <div className="aspect-square bg-muted">
        <img
          src={image.sourceUrl ?? undefined}
          alt={image.fileName}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate font-medium">{image.fileName}</p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}
