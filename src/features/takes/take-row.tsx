import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { formatTimestamp } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TakeRow({
  take,
  onDelete,
}: {
  take: {
    _id: string;
    _creationTime: number;
    sourceUrl: string | null;
    fileName: string;
  };
  onDelete: (id: string) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      {take.sourceUrl ? (
        <Link to="/gallery/$imageId" params={{ imageId: take._id }}>
          <img
            src={take.sourceUrl}
            alt={take.fileName}
            className="h-16 w-16 rounded object-cover"
          />
        </Link>
      ) : (
        <Skeleton className="h-16 w-16 rounded" />
      )}
      <div>
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
        <Button variant="ghost" size="icon-xs" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Spinner className="size-3" /> : <DownloadIcon className="size-3" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(take._id)}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
