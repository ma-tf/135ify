import type { FileRecord } from "@stores/file-store-types";

import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { GalleryCard } from "@features/gallery/gallery-card";
import { UsageBar, UsageBarSkeleton } from "@features/gallery/gallery-usage-bar";
import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { useCallback, useMemo } from "react";

export function GalleryPage() {
  const result = useQuery({ query: api.images.listByUser, args: {} });
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });
  const imageCache = useGalleryClientStore((s) => s.imageCache);
  const setImageCacheEntry = useGalleryClientStore((s) => s.setImageCacheEntry);

  const queryData = result.status === "success" ? result.data : null;

  const images = useMemo(
    () =>
      (queryData ?? []).map((doc) => {
        const cached = imageCache[doc._id];
        return {
          id: doc._id,
          fileName: doc.fileName,
          sourceUrl: doc.sourceUrl ?? "",
          params: {
            ...doc.params,
            selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
          },
          createdAt: doc._creationTime,
          renderUrl: cached?.renderUrl ?? null,
          isProcessing: cached?.isProcessing ?? false,
          renderError: cached?.renderError ?? null,
        } satisfies FileRecord;
      }),
    [queryData, imageCache],
  );

  const pendingFiles = useMemo(
    () => images.filter((f) => !f.renderUrl && !f.isProcessing),
    [images],
  );

  const updateFile = useCallback(
    (
      id: string,
      update: Partial<Pick<FileRecord, "renderUrl" | "isProcessing" | "renderError">>,
    ) => {
      setImageCacheEntry(id, update);
    },
    [setImageCacheEntry],
  );

  const storageValue = useMemo(
    () => ({
      files: images,
      addFiles: () => {},
      removeFile: () => {},
      updateParams: () => {},
      updateFile,
      loading: false,
      error: null,
    }),
    [images, updateFile],
  );

  const pending = result.status === "pending" || storageResult.status === "pending";
  const errored = result.status === "error" || storageResult.status === "error";

  if (pending) {
    return (
      <div className="space-y-4 p-6">
        <UsageBarSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">Failed to load images</p>
      </div>
    );
  }

  const usageData = storageResult.status === "success" ? storageResult.data : null;

  return (
    <StorageContext.Provider value={storageValue}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      <div className="space-y-6 p-6">
        {usageData && <UsageBar data={usageData} />}
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">No saved images yet.</p>
            <Link to="/" className="text-primary hover:underline">
              Process your first image
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <GalleryCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </div>
    </StorageContext.Provider>
  );
}
