import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { formatTimestamp } from "@lib/utils";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TakeRow({
  take,
  sourceFileName,
  onDelete,
}: {
  take: {
    _id: string;
    _creationTime: number;
    previewUrl: string | null;
    fullUrl: string | null;
    sourceFileName: string;
  };
  sourceFileName: string;
  onDelete: (id: string) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!take.fullUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(take.fullUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = take.sourceFileName.replace(/\.[^.]+$/, "") + "-ai-grain.jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download AI Take");
    }
    setIsDownloading(false);
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      {take.previewUrl ? (
        <img
          src={take.previewUrl}
          alt={sourceFileName}
          className="h-16 w-16 rounded object-cover"
        />
      ) : (
        <Skeleton className="h-16 w-16 rounded" />
      )}
      <div>
        <p className="text-sm font-medium">{sourceFileName}</p>
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
