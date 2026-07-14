import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useAction, useMutation, useQuery_experimental as useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

type RetryStatus = "idle" | "retrying" | "error";

export function useRetryTake() {
  const { apiKey } = useAiProviderStore();
  const retryJob = useMutation(api.aiGenerationJobs.retryJob);
  const processJob = useAction(api.aiGenerationJobsActions.processJob);
  const [status, setStatus] = useState<RetryStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const subscriptionsResult = useQuery({ query: api.subscriptions.byUser, args: {} });

  const subscriptions = useMemo(
    () => (subscriptionsResult.status === "success" ? subscriptionsResult.data : []),
    [subscriptionsResult],
  );

  const hasAiSub = subscriptions.some(
    (s) =>
      s.productKey === "ai_generation_platform" &&
      s.status !== "canceled" &&
      s.status !== "unpaid" &&
      s.status !== "incomplete_expired",
  );

  const canRetry = hasAiSub || !!apiKey;

  const retry = useCallback(
    async (jobId: string, key?: string) => {
      const resolvedKey = key ?? apiKey;
      if (!hasAiSub && !resolvedKey) return false;

      setError(null);
      setStatus("retrying");
      try {
        await retryJob({
          jobId: jobId as Id<"aiGenerationJobs">,
          ...(resolvedKey ? { apiKey: resolvedKey } : {}),
        });
        const args: { jobId: Id<"aiGenerationJobs">; apiKey?: string } = {
          jobId: jobId as Id<"aiGenerationJobs">,
        };
        if (resolvedKey) args.apiKey = resolvedKey;
        await processJob(args);
        setStatus("idle");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Retry failed");
      }
    },
    [apiKey, hasAiSub, retryJob, processJob],
  );

  return { retry, status, canRetry, error };
}
