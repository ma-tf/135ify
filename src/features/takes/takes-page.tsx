import type { Doc } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { UsageBar } from "@features/gallery/gallery-usage-bar";
import { TakeRow } from "@features/takes/take-row";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { useEffect } from "react";

type GalleryImage = Pick<
  Doc<"images">,
  "_id" | "_creationTime" | "fileName" | "parent" | "status" | "failureReason"
> & {
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
    const key = img.parent?.imageId ?? img.parent?.fileName ?? img._id;
    const existing = map.get(key);
    if (existing) {
      existing.takes.push(img);
    } else {
      map.set(key, {
        sourceImageId: key,
        sourceLinkId: img.parent?.imageId ?? (img.parent ? null : img._id),
        sourceFileName: img.parent?.fileName ?? img.fileName,
        takes: [img],
      });
    }
  }
  return [...map.values()];
}

export function TakesPage() {
  const result = useQuery({ query: api.images.listByUser, args: { source: "openai" } });
  const markSeen = useTakesNotificationStore((s) => s.markSeen);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const pending = result.status === "pending";
  const errored = result.status === "error";

  const activeTakes = result.status === "success" ? result.data : null;
  const groups = activeTakes ? groupBySourceImage(activeTakes) : [];

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
              <TakeRow key={take._id} take={take} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
