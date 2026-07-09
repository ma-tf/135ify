import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { api } from "@convex/_generated/api";
import { formatTimestamp } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TakeStatus = "queued" | "processing" | "completed" | "failed";

export type TakeRowTake = {
  _id: string;
  _creationTime: number;
  sourceUrl: string | null;
  fileName: string;
  status?: TakeStatus | null;
  failureReason?: string | null;
};

function TakeRowThumbnail({
  status,
  sourceUrl,
  imageId,
  fileName,
}: {
  status: TakeStatus;
  sourceUrl: string | null;
  imageId: string;
  fileName: string;
}) {
  if (status === "completed" && sourceUrl) {
    return (
      <Link to="/gallery/$imageId" params={{ imageId }}>
        <img src={sourceUrl} alt={fileName} className="h-16 w-16 rounded object-cover" />
      </Link>
    );
  }
  return <Skeleton className="h-16 w-16 rounded" />;
}

function QueuedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
      Queued
    </span>
  );
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

export function TakeRow({ take }: { take: TakeRowTake }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteImage = useMutation(api.images.deleteImage);
  const status = take.status ?? "completed";

  if (isDeleting) return null;

  const handleDownload = async () => {
    if (!take.sourceUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(take.sourceUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = take.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download AI Take");
    }
    setIsDownloading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteImage({ imageId: take._id as any });
    } catch {
      setIsDeleting(false);
      toast.error("Failed to delete AI Take");
    }
  };

  if (status !== "completed") {
    return (
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <TakeRowThumbnail
          status={status}
          sourceUrl={take.sourceUrl}
          imageId={take._id}
          fileName={take.fileName}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium text-muted-foreground">{take.fileName}</span>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatTimestamp(take._creationTime)}</p>
            {status === "queued" && <QueuedBadge />}
            {status === "processing" && <ProcessingBadge />}
            {status === "failed" && <FailedBadge failureReason={take.failureReason} />}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <TakeRowThumbnail
        status={status}
        sourceUrl={take.sourceUrl}
        imageId={take._id}
        fileName={take.fileName}
      />
      <div className="min-w-0">
        <Link
          to="/gallery/$imageId"
          params={{ imageId: take._id }}
          className="text-sm font-medium hover:underline"
        >
          {take.fileName}
        </Link>
        <p className="text-xs text-muted-foreground">{formatTimestamp(take._creationTime)}</p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-lg" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Spinner /> : <DownloadIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}
