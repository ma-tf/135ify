import { OverQuotaDialog } from "@components/over-quota-dialog";
import { api } from "@convex/_generated/api";
import { formatBytes, formatTimestamp } from "@lib/utils";
import { useQuery_experimental as useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import type { TakeRowJob } from "./take-row-thumbnail";

import { TakeRowThumbnail } from "./take-row-thumbnail";

function OverQuotaBadge({ resolved }: { resolved?: boolean }) {
  return (
    <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-orange-600 uppercase">
      {resolved ? "Resolved" : "Over Quota"}
    </span>
  );
}

function OverQuotaDialogWithUrl({ jobId, onDiscard }: { jobId: string; onDiscard: () => void }) {
  const result = useQuery({
    query: api.aiGenerationJobs.getOverQuotaUrl,
    args: { jobId: jobId as any },
  });
  const downloadUrl = result.status === "success" ? result.data : null;

  if (!downloadUrl) return null;

  return <OverQuotaDialog downloadUrl={downloadUrl} onDiscard={onDiscard} />;
}

export function OverQuotaTakeRow({ job }: { job: TakeRowJob }) {
  const [isOverQuotaResolved, setIsOverQuotaResolved] = useState(false);
  const [overQuotaDialogOpen, setOverQuotaDialogOpen] = useState(false);
  const clearOverQuota = useMutation(api.aiGenerationJobs.clearOverQuota);

  const overQuotaResolved = isOverQuotaResolved || !job.overQuotaStorageId;

  const handleThumbnailClick = () => {
    setOverQuotaDialogOpen(true);
  };

  const handleDiscard = async () => {
    try {
      await clearOverQuota({ jobId: job._id as any });
    } catch {
      toast.error("Failed to clear over-quota image");
    }
    setOverQuotaDialogOpen(false);
    setIsOverQuotaResolved(true);
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <TakeRowThumbnail
          status={job.status}
          thumbnailBase64={job.thumbnailBase64}
          takeImageId={job.takeImageId}
          fileName={job.fileName}
          overQuotaStorageId={job.overQuotaStorageId}
          onOverQuotaClick={!overQuotaResolved ? handleThumbnailClick : undefined}
        />
        <div className="min-w-0">
          {!overQuotaResolved && job.overQuotaStorageId ? (
            <button
              type="button"
              onClick={handleThumbnailClick}
              className="cursor-pointer text-sm font-medium hover:underline"
            >
              {job.fileName}
            </button>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{job.fileName}</span>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(job._creationTime)}
              {job.size != null && ` · ${formatBytes(job.size)}`}
            </p>
            <OverQuotaBadge resolved={overQuotaResolved} />
          </div>
        </div>
      </div>
      {overQuotaDialogOpen && job.overQuotaStorageId && (
        <OverQuotaDialogWithUrl jobId={job._id} onDiscard={handleDiscard} />
      )}
    </>
  );
}
