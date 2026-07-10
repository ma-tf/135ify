import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Button } from "@components/ui/button";
import { formatBytes } from "@lib/utils";
import { useCallback } from "react";

export function OverQuotaDialog({
  downloadUrl,
  size,
  onDiscard,
}: {
  downloadUrl: string;
  size?: number | null;
  onDiscard: () => void;
}) {
  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-grain.jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Download failed silently
    }
    onDiscard();
  }, [downloadUrl, onDiscard]);

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gallery storage full</AlertDialogTitle>
          <AlertDialogDescription>
            Your gallery is over capacity. Download the AI-generated image now or discard it.
            {size != null && <span className="mt-1 block">Image size: {formatBytes(size)}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center">
          <img
            src={downloadUrl}
            alt="AI generated preview"
            className="max-h-64 rounded-lg object-contain"
          />
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={handleDownload}>Download now</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
