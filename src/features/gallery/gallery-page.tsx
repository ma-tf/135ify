import type { FileRecord } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { GalleryCard } from "@features/gallery/gallery-card";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";

export function GalleryPage() {
  const result = useQuery({ query: api.images.listByUser, args: {} });

  if (result.status === "pending") {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">Failed to load images</p>
      </div>
    );
  }

  const images = (result.data ?? []).map(
    (doc) =>
      ({
        id: doc._id,
        fileName: doc.fileName,
        sourceUrl: doc.sourceUrl ?? "",
        params: {
          ...doc.params,
          selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
        },
        createdAt: doc._creationTime,
        renderUrl: doc.sourceUrl,
        isProcessing: false,
        renderError: null,
      }) satisfies FileRecord,
  );

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">No saved images yet.</p>
        <Link to="/" className="text-primary hover:underline">
          Process your first image
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <GalleryCard key={image.id} image={image} />
      ))}
    </div>
  );
}
