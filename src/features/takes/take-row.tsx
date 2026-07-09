import { OverQuotaDialog } from "@components/over-quota-dialog";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { api } from "@convex/_generated/api";
import { formatTimestamp } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery, useMutation } from "convex/react";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TakeStatus = "processing" | "completed" | "failed" | "overQuota";

export type TakeRowJob = {
  _id: string;
  _creationTime: number;
  fileName: string;
  status: TakeStatus;
  failureReason?: string | null;
  thumbnailBase64?: string | null;
  takeImageId?: string | null;
  takeImageUrl?: string | null;
  overQuotaStorageId?: string | null;
};

function TakeRowThumbnail({
  status,
  thumbnailBase64,
  takeImageId,
  fileName,
  overQuotaStorageId,
  onOverQuotaClick,
}: {
  status: TakeStatus;
  thumbnailBase64: string | null | undefined;
  takeImageId: string | null | undefined;
  fileName: string;
  overQuotaStorageId?: string | null;
  onOverQuotaClick?: () => void;
}) {
  if (status === "completed" && thumbnailBase64 && takeImageId) {
    return (
      <Link to="/gallery/$imageId" params={{ imageId: takeImageId }}>
        <img
          src={`data:image/jpeg;base64,${thumbnailBase64}`}
          alt={fileName}
          className="h-16 w-16 rounded object-cover"
        />
      </Link>
    );
  }

  if (status === "overQuota" && thumbnailBase64) {
    if (overQuotaStorageId && onOverQuotaClick) {
      return (
        <button onClick={onOverQuotaClick} className="cursor-pointer">
          <img
            src={`data:image/jpeg;base64,${thumbnailBase64}`}
            alt={fileName}
            className="h-16 w-16 rounded object-cover"
          />
        </button>
      );
    }
    return (
      <img
        src={`data:image/jpeg;base64,${thumbnailBase64}`}
        alt={fileName}
        className="h-16 w-16 rounded object-cover opacity-50"
      />
    );
  }

  return <Skeleton className="h-16 w-16 rounded" />;
}

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

function CompletedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
      Completed
    </span>
  );
}

function OverQuotaBadge({ resolved }: { resolved?: boolean }) {
  return (
    <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-orange-600 uppercase">
      {resolved ? "Resolved" : "Over Quota"}
    </span>
  );
}

export function TakeRow({ job }: { job: TakeRowJob }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOverQuotaResolved, setIsOverQuotaResolved] = useState(false);
  const [overQuotaDialogOpen, setOverQuotaDialogOpen] = useState(false);
  const clearOverQuota = useMutation(api.aiGenerationJobs.clearOverQuota);

  const status = job.status;
  const overQuotaResolved =
    isOverQuotaResolved || (status === "overQuota" && !job.overQuotaStorageId);

  const handleCompletedDownload = async () => {
    if (!job.takeImageUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(job.takeImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download AI Take");
    }
    setIsDownloading(false);
  };

  const handleOverQuotaThumbnailClick = () => {
    setOverQuotaDialogOpen(true);
  };

  const handleOverQuotaDiscard = async () => {
    try {
      await clearOverQuota({ jobId: job._id as any });
    } catch {
      toast.error("Failed to clear over-quota image");
    }
    setOverQuotaDialogOpen(false);
    setIsOverQuotaResolved(true);
  };

  if (status === "overQuota") {
    return (
      <>
        <div className="flex items-center gap-4 rounded-lg border p-3">
          <TakeRowThumbnail
            status={status}
            thumbnailBase64={job.thumbnailBase64}
            takeImageId={job.takeImageId}
            fileName={job.fileName}
            overQuotaStorageId={job.overQuotaStorageId}
            onOverQuotaClick={!overQuotaResolved ? handleOverQuotaThumbnailClick : undefined}
          />
          <div className="min-w-0">
            {!overQuotaResolved && job.overQuotaStorageId ? (
              <button
                onClick={handleOverQuotaThumbnailClick}
                className="cursor-pointer text-sm font-medium hover:underline"
              >
                {job.fileName}
              </button>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">{job.fileName}</span>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{formatTimestamp(job._creationTime)}</p>
              <OverQuotaBadge resolved={overQuotaResolved} />
            </div>
          </div>
        </div>
        {overQuotaDialogOpen && job.overQuotaStorageId && (
          <OverQuotaDialogWithUrl jobId={job._id} onDiscard={handleOverQuotaDiscard} />
        )}
      </>
    );
  }

  if (status !== "completed") {
    return (
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <TakeRowThumbnail
          status={status}
          thumbnailBase64={job.thumbnailBase64}
          takeImageId={job.takeImageId}
          fileName={job.fileName}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium text-muted-foreground">{job.fileName}</span>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatTimestamp(job._creationTime)}</p>
            {status === "processing" && <ProcessingBadge />}
            {status === "failed" && <FailedBadge failureReason={job.failureReason} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <TakeRowThumbnail
        status={status}
        thumbnailBase64={job.thumbnailBase64}
        takeImageId={job.takeImageId}
        fileName={job.fileName}
      />
      <div className="min-w-0">
        {job.takeImageId ? (
          <Link
            to="/gallery/$imageId"
            params={{ imageId: job.takeImageId }}
            className="text-sm font-medium hover:underline"
          >
            {job.fileName}
          </Link>
        ) : (
          <span className="text-sm font-medium">{job.fileName}</span>
        )}
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatTimestamp(job._creationTime)}</p>
          <CompletedBadge />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={handleCompletedDownload}
          disabled={isDownloading}
        >
          {isDownloading ? <Spinner /> : <DownloadIcon />}
        </Button>
      </div>
    </div>
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
