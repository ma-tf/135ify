import { AiKeyForm } from "@components/ai-key-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

export function AiKeyDialog({
  onOpenChange,
  onSave,
  hasAiSub,
}: {
  onOpenChange: (open: boolean) => void;
  onSave?: (apiKey: string) => void;
  hasAiSub?: boolean;
}) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI grain generation.
          </DialogDescription>
        </DialogHeader>
        <AiKeyForm
          hasAiSub={hasAiSub}
          onSaved={(key) => {
            onSave?.(key);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
