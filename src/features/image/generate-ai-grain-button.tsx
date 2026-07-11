import { AiKeyDialog } from "@components/ai-key-dialog";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { FEATURE_AI_GRAIN } from "@config";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { useAiGrainGeneration } from "@hooks/useAiGrainGeneration";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useQuery_experimental as useQuery } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

export function GenerateAiGrainButton() {
  const { isAuthenticated } = useAuth();
  const { apiKey } = useAiProviderStore();
  const { trigger, isGenerating } = useAiGrainGeneration();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });
  const atLimit = storageResult.status === "success" && storageResult.data.atLimit;

  if (!FEATURE_AI_GRAIN) return null;
  if (!isAuthenticated) return null;

  const handleClick = async () => {
    if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    }
    await trigger(apiKey);
  };

  return (
    <>
      <Button
        disabled={isGenerating || atLimit}
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleClick}
      >
        {isGenerating ? <Spinner className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
        Generate AI Film Grain
      </Button>
      {keyDialogOpen && (
        <AiKeyDialog onOpenChange={setKeyDialogOpen} onSave={(key) => trigger(key)} />
      )}
    </>
  );
}
