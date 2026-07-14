import type { TakeRowJob } from "@features/takes/take-row-thumbnail";

import { Spinner } from "@components/ui/spinner";
import { TakeRowThumbnail } from "@features/takes/take-row-thumbnail";
import { formatTimestamp } from "@lib/utils";

function ProcessingBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
      <Spinner className="mr-1 size-2.5" />
      Processing
    </span>
  );
}

export function PendingTakeRow({ job }: { job: TakeRowJob }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3 shadow-md">
      <TakeRowThumbnail
        status={job.status}
        thumbnailBase64={job.thumbnailBase64}
        takeImageId={job.takeImageId}
        fileName={job.fileName}
      />
      <div className="min-w-0">
        <span className="text-sm font-medium text-muted-foreground">{job.fileName}</span>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatTimestamp(job._creationTime)}</p>
          <ProcessingBadge />
        </div>
      </div>
    </div>
  );
}
