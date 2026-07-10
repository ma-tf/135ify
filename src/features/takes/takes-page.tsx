import type { Doc } from "@convex/_generated/dataModel";

import { Button } from "@components/ui/button";
import { api } from "@convex/_generated/api";
import { UsageBar } from "@features/gallery/gallery-usage-bar";
import { CompletedTakeRow } from "@features/takes/completed-take-row";
import { OverQuotaTakeRow } from "@features/takes/over-quota-take-row";
import { PendingTakeRow } from "@features/takes/pending-take-row";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery_experimental as useQuery } from "convex/react";
import { useEffect } from "react";
import { toast } from "sonner";

type JobRow = Pick<
  Doc<"aiGenerationJobs">,
  | "_id"
  | "_creationTime"
  | "fileName"
  | "parent"
  | "status"
  | "failureReason"
  | "thumbnailBase64"
  | "takeImageId"
  | "overQuotaStorageId"
> & {
  takeImageUrl: string | null;
  size: number | null;
};

interface TakeSection {
  sourceImageId: string;
  sourceLinkId: string | null;
  sourceFileName: string;
  takes: JobRow[];
}

function groupBySourceImage(jobs: JobRow[]): TakeSection[] {
  const map = new Map<string, TakeSection>();
  for (const job of jobs) {
    const key = job.parent?.imageId ?? job.parent?.fileName ?? job._id;
    const existing = map.get(key);
    if (existing) {
      existing.takes.push(job);
    } else {
      map.set(key, {
        sourceImageId: key,
        sourceLinkId: job.parent?.imageId ?? null,
        sourceFileName: job.parent?.fileName ?? job.fileName,
        takes: [job],
      });
    }
  }
  return [...map.values()];
}

export function TakesPage() {
  const result = useQuery({ query: api.aiGenerationJobs.listByUser, args: {} });
  const markSeen = useTakesNotificationStore((s) => s.markSeen);
  const clearResolved = useMutation(api.aiGenerationJobs.clearResolvedTakes);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const pending = result.status === "pending";
  const errored = result.status === "error";

  const jobs = result.status === "success" ? result.data : null;
  const resolvedJobIds = jobs
    ? jobs.filter((j) => j.status === "overQuota" && !j.overQuotaStorageId).map((j) => j._id as any)
    : [];
  const groups = jobs ? groupBySourceImage(jobs) : [];

  return (
    <div className="space-y-8 p-6">
      <UsageBar />
      {pending ? (
        <TakesSkeleton />
      ) : errored ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-destructive">Failed to load AI Takes</p>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-muted-foreground">No AI Takes yet.</p>
          <Link to="/" className="text-primary hover:underline">
            Process your first image
          </Link>
        </div>
      ) : (
        <>
          {resolvedJobIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await clearResolved({ jobIds: resolvedJobIds });
                toast.success("Cleared resolved takes");
              }}
            >
              Clear resolved takes
            </Button>
          )}
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
                {group.takes.map((take) => {
                  if (take.status === "overQuota") {
                    return <OverQuotaTakeRow key={take._id} job={take} />;
                  }
                  if (take.status !== "completed") {
                    return <PendingTakeRow key={take._id} job={take} />;
                  }
                  return <CompletedTakeRow key={take._id} job={take} />;
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
