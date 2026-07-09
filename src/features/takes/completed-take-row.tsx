import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { formatTimestamp } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { TakeRowJob } from "./take-row-thumbnail";

import { TakeRowThumbnail } from "./take-row-thumbnail";

function CompletedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
      Completed
    </span>
  );
}

export function CompletedTakeRow({ job }: { job: TakeRowJob }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
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

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <TakeRowThumbnail
        status={job.status}
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
        <Button variant="ghost" size="icon-lg" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Spinner /> : <DownloadIcon />}
        </Button>
      </div>
    </div>
  );
}
