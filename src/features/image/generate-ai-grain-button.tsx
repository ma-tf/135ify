import { AiKeyDialog } from "@components/ai-key-dialog";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
import { FEATURE_AI_GRAIN, FEATURE_SUBSCRIPTIONS } from "@config";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { useAiGrainGeneration } from "@hooks/useAiGrainGeneration";
import { formatDate } from "@lib/utils";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useQuery_experimental as useQuery } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

function useAiSubUsage() {
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });
  const subscriptionsResult = useQuery({ query: api.subscriptions.byUser, args: {} });
  const aiUsageResult = useQuery({ query: api.usage.getAiUsage, args: {} });

  const isPending =
    storageResult.status === "pending" ||
    subscriptionsResult.status === "pending" ||
    aiUsageResult.status === "pending";

  const atStorageLimit = storageResult.status === "success" && storageResult.data.atLimit;

  const hasAiSub =
    FEATURE_SUBSCRIPTIONS &&
    subscriptionsResult.status === "success" &&
    subscriptionsResult.data.some((s) => s.productKeys.includes("ai_generation_platform"));

  const atAiLimit = aiUsageResult.status === "success" && aiUsageResult.data?.atLimit;
  const capResetsAt =
    aiUsageResult.status === "success" && aiUsageResult.data?.atLimit && aiUsageResult.data
      ? formatDate(aiUsageResult.data.resetsAt)
      : null;

  return { atStorageLimit, hasAiSub, atAiLimit, capResetsAt, isPending };
}

function GenerateAiGrainButtonSkeleton() {
  return <Skeleton className="h-8 w-44 rounded-md" />;
}

export function GenerateAiGrainButton({ showOriginal }: { showOriginal: boolean }) {
  const { isAuthenticated } = useAuth();
  const { apiKey, preferUserKey } = useAiProviderStore();
  const { trigger, isGenerating, errorState } = useAiGrainGeneration();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const { atStorageLimit, hasAiSub, atAiLimit, capResetsAt, isPending } = useAiSubUsage();

  if (!FEATURE_AI_GRAIN) return null;
  if (!isAuthenticated) return null;
  if (isPending) return <GenerateAiGrainButtonSkeleton />;

  const usingPlatform = hasAiSub && !preferUserKey;

  const handleClick = async () => {
    if (usingPlatform) {
      void trigger(undefined, showOriginal);
    } else if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    } else {
      await trigger(apiKey, showOriginal);
    }
  };

  const disabled = isGenerating || atStorageLimit || !!errorState || (atAiLimit && usingPlatform);

  function getTitle() {
    if (errorState) {
      return errorState.kind === "suspended"
        ? errorState.reason
        : "Generation rate limited. Try again soon.";
    }
    if (atAiLimit && capResetsAt) {
      return `Monthly AI generation cap reached. Resets ${capResetsAt}.`;
    }
    return undefined;
  }

  return (
    <>
      <Button
        disabled={disabled}
        variant="outline"
        size="sm"
        className="gap-1.5 shadow-xs"
        onClick={handleClick}
        title={getTitle()}
      >
        {isGenerating ? <Spinner className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
        Generate AI Film Grain
      </Button>
      {keyDialogOpen && (
        <AiKeyDialog
          onOpenChange={setKeyDialogOpen}
          onSave={(key) => trigger(key, showOriginal)}
          hasAiSub={hasAiSub}
        />
      )}
    </>
  );
}
