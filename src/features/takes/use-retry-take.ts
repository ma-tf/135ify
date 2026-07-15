import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useAction, useMutation, useQuery_experimental as useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

type RetryStatus = "idle" | "retrying" | "error";

function useResolvedAiKey() {
  const apiKey = useAiProviderStore((s) => s.apiKey);
  const preferPlatformKey = useAiProviderStore((s) => s.preferPlatformKey);

  const subscriptionsResult = useQuery({ query: api.subscriptions.byUser, args: {} });

  const hasActiveAiSub = useMemo(() => {
    if (subscriptionsResult.status !== "success") return false;
    return subscriptionsResult.data.some((s) => s.productKeys.includes("ai_generation_platform"));
  }, [subscriptionsResult]);

  const usePlatform = hasActiveAiSub && preferPlatformKey;
  const canRetry = usePlatform || !!apiKey;

  return { apiKey, usePlatform, canRetry };
}

export function useRetryTake() {
  const { apiKey, usePlatform, canRetry } = useResolvedAiKey();
  const retryJob = useMutation(api.aiGenerationJobs.retryJob);
  const processJob = useAction(api.aiGenerationJobsActions.processJob);
  const [status, setStatus] = useState<RetryStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(
    async (jobId: string, key?: string) => {
      const resolvedKey = key ?? apiKey;
      if (!usePlatform && !resolvedKey) return false;

      setError(null);
      setStatus("retrying");

      const args = {
        jobId: jobId as Id<"aiGenerationJobs">,
        ...(resolvedKey ? { apiKey: resolvedKey } : {}),
      };

      try {
        await retryJob(args);
        await processJob(args);
        setStatus("idle");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Retry failed");
      }
    },
    [apiKey, usePlatform, retryJob, processJob],
  );

  return { retry, status, canRetry, error };
}
