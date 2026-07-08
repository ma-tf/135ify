import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Field, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AiKeyDialog({
  onOpenChange,
  onSave,
}: {
  onOpenChange: (open: boolean) => void;
  onSave?: (apiKey: string) => void;
}) {
  const { apiKey, setApiKey, clearApiKey } = useAiProviderStore();
  const [inputValue, setInputValue] = useState(apiKey);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const handleSave = () => {
    setApiKey(inputValue);
    toast.success("API key saved");
    onSave?.(inputValue);
    onOpenChange(false);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue("");
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI grain generation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Field>
            <FieldLabel htmlFor="api-key">API Key</FieldLabel>

            <div className="relative">
              <Input
                id="api-key"
                type={isVisible ? "text" : "password"}
                placeholder="sk-..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                aria-label={isVisible ? "Hide api key" : "Show api key"}
                aria-pressed={isVisible}
                className="absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={toggleVisibility}
                type="button"
              >
                {isVisible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!apiKey} onClick={handleClear}>
            Clear
          </Button>
          <Button disabled={!inputValue} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
