import type { TakeRowJob } from "@features/takes/take-row-thumbnail";

import { AiKeyDialog } from "@components/ai-key-dialog";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { TakeRowThumbnail } from "@features/takes/take-row-thumbnail";
import { useRetryTake } from "@features/takes/use-retry-take";
import { formatTimestamp } from "@lib/utils";
import { RotateCw } from "lucide-react";
import { useState } from "react";

function ProcessingBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
      <Spinner className="mr-1 size-2.5" />
      Processing
    </span>
  );
}

function FailedBadge({ failureReason }: { failureReason?: string | null }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-destructive uppercase"
      title={failureReason ?? undefined}
    >
      Failed
    </span>
  );
}

export function PendingTakeRow({ job }: { job: TakeRowJob }) {
  const { retry, isRetrying, hasApiKey } = useRetryTake();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const handleRetry = () => {
    if (hasApiKey) {
      void retry(job._id);
    } else {
      setKeyDialogOpen(true);
    }
  };

  const handleSaveKey = (key: string) => {
    setKeyDialogOpen(false);
    void retry(job._id, key);
  };

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
          {job.status === "processing" && <ProcessingBadge />}
          {job.status === "failed" && <FailedBadge failureReason={job.failureReason} />}
        </div>
      </div>
      {job.status === "failed" && (
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-lg" onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? <Spinner /> : <RotateCw />}
          </Button>
        </div>
      )}
      {keyDialogOpen && <AiKeyDialog onOpenChange={setKeyDialogOpen} onSave={handleSaveKey} />}
    </div>
  );
}
