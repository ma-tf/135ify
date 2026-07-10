import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { useAction, useMutation } from "convex/react";
import { useCallback, useState } from "react";

export function useRetryTake() {
  const { apiKey } = useAiProviderStore();
  const retryJob = useMutation(api.aiGenerationJobs.retryJob);
  const processJob = useAction(api.aiGenerationJobsActions.processJob);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (jobId: string, key?: string) => {
      const resolvedKey = key ?? apiKey;
      if (!resolvedKey) return false;

      setIsRetrying(true);
      try {
        await retryJob({ jobId: jobId as Id<"aiGenerationJobs"> });
        await processJob({ jobId: jobId as Id<"aiGenerationJobs">, apiKey: resolvedKey });
      } catch {
        // processJob sets status to "failed" internally on error
      }
      setIsRetrying(false);
    },
    [apiKey, retryJob, processJob],
  );

  return { retry, isRetrying, hasApiKey: Boolean(apiKey) };
}
