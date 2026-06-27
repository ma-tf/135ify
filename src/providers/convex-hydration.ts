import type { Doc } from "@convex/_generated/dataModel";
import type { FileRecord } from "@stores/file-store-types";

export type ConvexImageDoc = Doc<"images"> & { sourceUrl: string | null };

export function hydrateFromConvex(
  docs: ConvexImageDoc[],
  existingFiles: FileRecord[],
): FileRecord[] {
  return docs.map((doc) => {
    const existing = existingFiles.find((f) => f.id === doc._id);
    return {
      id: doc._id as string,
      fileName: doc.fileName,
      sourceUrl: doc.sourceUrl ?? "",
      params: {
        ...doc.params,
        selectedFilmId: doc.params.selectedFilmId as FileRecord["params"]["selectedFilmId"],
      },
      createdAt: doc._creationTime,
      renderUrl: existing?.renderUrl ?? null,
      isProcessing: existing?.isProcessing ?? false,
      renderError: existing?.renderError ?? null,
    };
  });
}
