import type { Doc } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { UsageBar } from "@features/gallery/gallery-usage-bar";
import { TakeRow } from "@features/takes/take-row";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { useEffect } from "react";

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

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const pending = result.status === "pending";
  const errored = result.status === "error";

  const jobs = result.status === "success" ? result.data : null;
  const groups = jobs ? groupBySourceImage(jobs) : [];

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

  if (!jobs || jobs.length == 0) {
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
              <TakeRow key={take._id} job={take} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
