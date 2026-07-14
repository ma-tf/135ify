import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { useFile } from "@providers/file-context";
import { useNavigate } from "@tanstack/react-router";
import { useAction, useConvex, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { toast } from "sonner";

type ErrorState = { kind: "suspended"; reason: string } | { kind: "rateLimited" };

function handleJobError(e: unknown, setErrorState: (state: ErrorState) => void): void {
  if (e instanceof ConvexError) {
    const data = e.data as { kind?: string };
    if (data.kind === "RateLimited") {
      setErrorState({ kind: "rateLimited" });
      toast.error("Generation rate limited. Try again soon.");
      return;
    }
  }
  const reason = e instanceof Error ? e.message : "Generation failed";
  setErrorState({ kind: "suspended", reason });
  toast.error(reason);
}

function usePrepareSourceStorageId() {
  const file = useFile();
  const convex = useConvex();
  const generateUploadUrl = useMutation(api.lib.generateUploadUrl);

  return async (showOriginal: boolean): Promise<Id<"_storage">> => {
    if (file.convexId && showOriginal) {
      const image = await convex.query(api.images.getById, {
        imageId: file.convexId as Id<"images">,
      });
      if (!image?.sourceStorageId) throw new Error("Source image not found");
      return image.sourceStorageId as Id<"_storage">;
    }
    const uploadUrl = await generateUploadUrl();
    const blobUrl = showOriginal ? file.sourceUrl : (file.renderUrl ?? file.sourceUrl);
    const blob = await fetch(blobUrl).then((r) => r.blob());
    const response = await fetch(uploadUrl, { method: "POST", body: blob });
    if (!response.ok) throw new Error("Failed to upload source image");
    const result = (await response.json()) as { storageId: Id<"_storage"> };
    return result.storageId;
  };
}

export function useAiGrainGeneration() {
  const file = useFile();
  const onClose = useEditViewClose();
  const navigate = useNavigate();
  const prepareSourceStorageId = usePrepareSourceStorageId();
  const createJob = useMutation(api.aiGenerationJobs.createJob);
  const processJob = useAction(api.aiGenerationJobsActions.processJob);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const trigger = async (apiKey: string | undefined, showOriginal: boolean) => {
    setIsGenerating(true);
    setErrorState(null);

    let sourceStorageId: Id<"_storage"> = undefined!;
    let jobId: Id<"aiGenerationJobs"> = undefined!;

    const parent = file.convexId
      ? { imageId: file.convexId as Id<"images">, fileName: crypto.randomUUID() }
      : { fileName: crypto.randomUUID() };

    const createJobArgs = {
      fileName: crypto.randomUUID(),
      parent,
      ...(apiKey ? { apiKey } : {}),
    };

    try {
      sourceStorageId = await prepareSourceStorageId(showOriginal);

      jobId = await createJob({ ...createJobArgs, sourceStorageId });
    } catch (e) {
      setIsGenerating(false);
      if (!sourceStorageId) throw e;
      handleJobError(e, setErrorState);
      return;
    }

    setIsGenerating(false);

    void processJob({ jobId, ...(apiKey ? { apiKey } : {}) });

    onClose();
    void navigate({ to: "/takes" });
  };

  return { trigger, isGenerating, errorState };
}
