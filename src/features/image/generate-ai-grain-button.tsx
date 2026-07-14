import { AiKeyDialog } from "@components/ai-key-dialog";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { FEATURE_AI_GRAIN, FEATURE_SUBSCRIPTIONS } from "@config";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { useAiGrainGeneration } from "@hooks/useAiGrainGeneration";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useQuery_experimental as useQuery } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

function useAiSubUsage() {
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });
  const subscriptionsResult = useQuery({ query: api.subscriptions.byUser, args: {} });
  const aiUsageResult = useQuery({ query: api.aiGenerationJobs.getAiUsage, args: {} });

  const isPending =
    storageResult.status === "pending" ||
    subscriptionsResult.status === "pending" ||
    aiUsageResult.status === "pending";

  const atStorageLimit = storageResult.status === "success" && storageResult.data.atLimit;

  const hasAiSub =
    FEATURE_SUBSCRIPTIONS &&
    subscriptionsResult.status === "success" &&
    subscriptionsResult.data.some(
      (s) =>
        s.productKey === "ai_generation_platform" &&
        (s.status === "active" || s.status === "trialing"),
    );

  const atAiLimit = aiUsageResult.status === "success" && aiUsageResult.data?.atLimit;
  const capResetsAt =
    aiUsageResult.status === "success" && aiUsageResult.data?.atLimit && aiUsageResult.data
      ? new Date(aiUsageResult.data.resetsAt).toLocaleDateString()
      : null;

  return { atStorageLimit, hasAiSub, atAiLimit, capResetsAt, isPending };
}

function GenerateAiGrainButtonSkeleton() {
  return <Skeleton className="h-8 w-44 rounded-md" />;
}

export function GenerateAiGrainButton({ showOriginal }: { showOriginal: boolean }) {
  const { isAuthenticated } = useAuth();
  const { apiKey } = useAiProviderStore();
  const { trigger, isGenerating } = useAiGrainGeneration();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const { atStorageLimit, hasAiSub, atAiLimit, capResetsAt, isPending } = useAiSubUsage();

  if (!FEATURE_AI_GRAIN) return null;
  if (!isAuthenticated) return null;
  if (isPending) return <GenerateAiGrainButtonSkeleton />;

  const handleClick = async () => {
    if (hasAiSub) {
      void trigger(undefined, showOriginal);
    } else if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    } else {
      await trigger(apiKey, showOriginal);
    }
  };

  const disabled = isGenerating || atStorageLimit || atAiLimit;

  return (
    <>
      <Button
        disabled={disabled}
        variant="outline"
        size="sm"
        className="gap-1.5 shadow-xs"
        onClick={handleClick}
        title={
          atAiLimit && capResetsAt
            ? `Monthly AI generation cap reached. Resets ${capResetsAt}.`
            : undefined
        }
      >
        {isGenerating ? <Spinner className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
        Generate AI Film Grain
      </Button>
      {keyDialogOpen && (
        <AiKeyDialog onOpenChange={setKeyDialogOpen} onSave={(key) => trigger(key, showOriginal)} />
      )}
    </>
  );
}
