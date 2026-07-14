import type { FileRecord } from "@stores/file-store-types";

import { GalleryCard } from "@features/gallery/gallery-card";
import { GallerySkeleton } from "@features/gallery/gallery-skeleton";
import { UsageBar } from "@features/gallery/gallery-usage-bar";
import { UpgradePrompt } from "@features/gallery/upgrade-prompt";
import { useGalleryData } from "@features/gallery/use-gallery-data";
import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { Link } from "@tanstack/react-router";

export function GalleryPage() {
  const { result, images, pendingFiles, storageValue } = useGalleryData();

  const pending = result.status === "pending";
  const errored = result.status === "error";

  if (pending) {
    return <GallerySkeleton />;
  }

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">Failed to load images</p>
      </div>
    );
  }

  return (
    <StorageContext.Provider value={storageValue}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      <div className="space-y-6 p-6">
        <UsageBar />
        <UpgradePrompt />
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">No saved images yet.</p>
            <Link to="/" className="text-primary hover:underline">
              Process your first image
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image: FileRecord) => (
              <GalleryCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </div>
    </StorageContext.Provider>
  );
}
