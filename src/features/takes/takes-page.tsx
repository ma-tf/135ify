import type { Doc, Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { UsageBar } from "@features/gallery/gallery-usage-bar";
import { TakeRow } from "@features/takes/take-row";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type GalleryImage = Pick<Doc<"images">, "_id" | "_creationTime" | "fileName" | "parent"> & {
  sourceUrl: string | null;
};

interface TakeSection {
  sourceImageId: string;
  sourceLinkId: string | null;
  sourceFileName: string;
  takes: GalleryImage[];
}

function groupBySourceImage(images: GalleryImage[]): TakeSection[] {
  const map = new Map<string, TakeSection>();
  for (const img of images) {
    let key: string;
    let linkId: string | null;
    let label: string;

    if (img.parent?.imageId) {
      key = img.parent.imageId;
      linkId = key;
      label = img.parent.fileName;
    } else if (img.parent?.fileName) {
      key = img.parent.fileName;
      linkId = null;
      label = img.parent.fileName;
    } else {
      key = img._id;
      linkId = key;
      label = img.fileName;
    }

    const existing = map.get(key);
    if (existing) {
      existing.takes.push(img);
    } else {
      map.set(key, {
        sourceImageId: key,
        sourceLinkId: linkId,
        sourceFileName: label,
        takes: [img],
      });
    }
  }
  return [...map.values()];
}

export function TakesPage() {
  const result = useQuery({ query: api.images.listByUser, args: { source: "openai" } });
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const markSeen = useTakesNotificationStore((s) => s.markSeen);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const pending = result.status === "pending";
  const errored = result.status === "error";

  const activeTakes =
    result.status === "success" ? result.data?.filter((t) => !deletedIds.has(t._id)) : null;
  const groups = activeTakes ? groupBySourceImage(activeTakes) : [];

  const deleteImage = useMutation(api.images.deleteImage);

  const handleDelete = async (imageId: string) => {
    setDeletedIds((prev) => new Set(prev).add(imageId));
    try {
      await deleteImage({ imageId: imageId as Id<"images"> });
    } catch {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
      toast.error("Failed to delete AI Take");
    }
  };

  if (pending) {
    return <TakesSkeleton />;
  }

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">Failed to load AI Takes</p>
      </div>
    );
  }

  if (!activeTakes || activeTakes.length == 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">No AI Takes yet.</p>
        <Link to="/" className="text-primary hover:underline">
          Process your first image
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <UsageBar />
      {groups.map((group) => (
        <section key={group.sourceImageId}>
          {group.sourceLinkId ? (
            <Link
              to="/gallery/$imageId"
              params={{ imageId: group.sourceLinkId }}
              className="mb-3 text-sm font-medium text-muted-foreground hover:underline"
            >
              {group.sourceFileName}
            </Link>
          ) : (
            <span className="mb-3 block text-sm font-medium text-muted-foreground">
              {group.sourceFileName}
            </span>
          )}
          <div className="space-y-2">
            {group.takes.map((take) => (
              <TakeRow key={take._id} take={take} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
