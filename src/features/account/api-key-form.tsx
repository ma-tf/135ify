import { Button } from "@components/ui/button";
import { Field, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ApiKeyForm() {
  const { apiKey, setApiKey, clearApiKey } = useAiProviderStore();
  const [inputValue, setInputValue] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue);
    toast.success("API key saved");
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue("");
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">API Key</h2>
        <p className="text-sm text-muted-foreground">
          Your API key is stored locally and never sent to our servers. If you have an active AI
          generation subscription, the platform key takes priority.
        </p>
      </div>
      <Field>
        <FieldLabel htmlFor="api-key">OpenAI API Key</FieldLabel>
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
        <Button variant="destructive" disabled={!apiKey} onClick={handleClear}>
          Clear
        </Button>
        <Button disabled={!inputValue} onClick={handleSave}>
          Save
        </Button>
      </div>
    </section>
  );
}
