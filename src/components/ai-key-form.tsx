import { Button } from "@components/ui/button";
import { Field, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Switch } from "@components/ui/switch";
import { FEATURE_SUBSCRIPTIONS } from "@config";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AiKeyForm({
  hasAiSub,
  onSaved,
  onCancel,
}: {
  hasAiSub?: boolean;
  onSaved?: (apiKey: string) => void;
  onCancel?: () => void;
}) {
  const { apiKey, preferUserKey, setApiKey, clearApiKey, setPreferUserKey } = useAiProviderStore();
  const [inputValue, setInputValue] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue);
    setPreferUserKey(true);
    toast.success("API key saved");
    onSaved?.(inputValue);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-4">
      {FEATURE_SUBSCRIPTIONS && hasAiSub && apiKey && (
        <Field orientation="horizontal">
          <Switch
            id="use-platform-key"
            checked={preferUserKey}
            onCheckedChange={(checked) => setPreferUserKey(checked)}
          />
          <FieldLabel htmlFor="use-platform-key">Use my own API key</FieldLabel>
        </Field>
      )}
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
            className="absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setIsVisible((v) => !v)}
            type="button"
          >
            {isVisible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          </button>
        </div>
      </Field>
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="destructive" disabled={!apiKey} onClick={handleClear}>
          Clear
        </Button>
        <Button disabled={!inputValue} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
