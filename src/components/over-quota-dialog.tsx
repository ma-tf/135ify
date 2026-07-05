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

export function OverQuotaDialog({ base64, onDiscard }: { base64: string; onDiscard: () => void }) {
  const handleDownload = useCallback(() => {
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-grain.jpg";
    a.click();
    URL.revokeObjectURL(url);
  }, [base64]);

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
            src={`data:image/jpeg;base64,${base64}`}
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
