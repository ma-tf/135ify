import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { UsageBar, UsageBarSkeleton } from "@features/gallery/gallery-usage-bar";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { formatTimestamp } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";

interface TakeSection {
  sourceImageId: string;
  sourceFileName: string | null;
  takes: {
    _id: string;
    _creationTime: number;
    sourceImageId: string;
    sourceFileName: string | null;
    previewUrl: string | null;
    fullUrl: string | null;
  }[];
}

function groupBySourceImage(takes: TakeSection["takes"]): TakeSection[] {
  const map = new Map<string, TakeSection>();
  for (const take of takes) {
    const existing = map.get(take.sourceImageId);
    if (existing) {
      existing.takes.push(take);
    } else {
      map.set(take.sourceImageId, {
        sourceImageId: take.sourceImageId,
        sourceFileName: take.sourceFileName,
        takes: [take],
      });
    }
  }
  return [...map.values()];
}

export function TakesPage() {
  const result = useQuery({ query: api.aiTakes.listByUser, args: {} });
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });

  const pending = result.status === "pending";
  const errored = result.status === "error" || storageResult.status === "error";
  const usageData = storageResult.status === "success" ? storageResult.data : null;

  const takes = result.status === "success" ? result.data : null;
  const groups = takes ? groupBySourceImage(takes) : [];

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

  if (result.data.length == 0) {
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
      {usageData ? <UsageBar data={usageData} /> : <UsageBarSkeleton />}
      {groups.map((group) => (
        <section key={group.sourceImageId}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {group.sourceFileName ?? "Unknown"}
          </h2>
          <div className="space-y-2">
            {group.takes.map((take) => (
              <div key={take._id} className="flex items-center gap-4 rounded-lg border p-3">
                {take.previewUrl ? (
                  <img
                    src={take.previewUrl}
                    alt={group.sourceFileName ?? ""}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <Skeleton className="h-16 w-16 rounded" />
                )}
                <div>
                  <p className="text-sm font-medium">{group.sourceFileName ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(take._creationTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
