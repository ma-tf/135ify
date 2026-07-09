import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { useCallback } from "react";

export function OverQuotaDialog({
  downloadUrl,
  onDiscard,
}: {
  downloadUrl: string;
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
    <Dialog open={true} onOpenChange={() => onDiscard()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gallery storage full</DialogTitle>
          <DialogDescription>
            Your gallery is over capacity. Download the AI-generated image now or discard it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <img
            src={downloadUrl}
            alt="AI generated preview"
            className="max-h-64 rounded-lg object-contain"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={handleDownload}>Download now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
