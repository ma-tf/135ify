import { Skeleton } from "@components/ui/skeleton";
import { useStorage } from "@providers/storage-context";
import { Link } from "@tanstack/react-router";

import { GalleryCard } from "./gallery-card";

export function GalleryPage() {
  const { loading, error, files } = useStorage();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">Failed to load images</p>
      </div>
    );
  }

  if (files.length === 0) {
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
      {files.map((image) => (
        <GalleryCard key={image.id} image={image} />
      ))}
    </div>
  );
}
