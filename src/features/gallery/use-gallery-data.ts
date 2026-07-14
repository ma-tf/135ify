import type { Doc } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

import { api } from "@convex/_generated/api";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { useQuery_experimental as useQuery } from "convex/react";
import { useCallback, useMemo } from "react";

export function useGalleryData() {
  const result = useQuery({ query: api.images.listByUser, args: {} });
  const imageCache = useGalleryClientStore((s) => s.imageCache);
  const setImageCacheEntry = useGalleryClientStore((s) => s.setImageCacheEntry);

  const queryData = result.status === "success" ? result.data : null;

  const images = useMemo(
    () =>
      (queryData ?? []).map(
        (doc: Doc<"images"> & { sourceUrl: string | null; size: number | null }) => {
          const cached = imageCache[doc._id];
          return {
            id: doc._id,
            fileName: doc.fileName,
            sourceUrl: doc.sourceUrl ?? "",
            params: {
              ...doc.params,
              selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
            },
            convexId: doc._id,
            createdAt: doc._creationTime,
            renderUrl: cached?.renderUrl ?? null,
            isProcessing: cached?.isProcessing ?? false,
            renderError: cached?.renderError ?? null,
            size: doc.size ?? null,
          } satisfies FileRecord;
        },
      ),
    [queryData, imageCache],
  );

  const pendingFiles = useMemo(
    () => images.filter((f: FileRecord) => !f.renderUrl && !f.isProcessing),
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

  return { result, images, pendingFiles, storageValue };
}
