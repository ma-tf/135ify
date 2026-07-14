import type { Id } from "@convex/_generated/dataModel";

import { api } from "@convex/_generated/api";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { useFile } from "@providers/file-context";
import { useNavigate } from "@tanstack/react-router";
import { useAction, useConvex, useMutation } from "convex/react";
import { useState } from "react";

export function useAiGrainGeneration() {
  const file = useFile();
  const onClose = useEditViewClose();
  const navigate = useNavigate();
  const convex = useConvex();
  const generateUploadUrl = useMutation(api.lib.generateUploadUrl);
  const createJob = useMutation(api.aiGenerationJobs.createJob);
  const processJob = useAction(api.aiGenerationJobsActions.processJob);
  const [isGenerating, setIsGenerating] = useState(false);

  const trigger = async (apiKey: string | undefined, showOriginal: boolean) => {
    setIsGenerating(true);

    let sourceStorageId: Id<"_storage">;
    if (file.convexId && showOriginal) {
      const image = await convex.query(api.images.getById, {
        imageId: file.convexId as Id<"images">,
      });
      if (!image?.sourceStorageId) throw new Error("Source image not found");
      sourceStorageId = image.sourceStorageId as Id<"_storage">;
    } else {
      const uploadUrl = await generateUploadUrl();
      const blobUrl = showOriginal ? file.sourceUrl : (file.renderUrl ?? file.sourceUrl);
      const blob = await fetch(blobUrl).then((r) => r.blob());
      const response = await fetch(uploadUrl, { method: "POST", body: blob });
      if (!response.ok) throw new Error("Failed to upload source image");
      const result = (await response.json()) as { storageId: Id<"_storage"> };
      sourceStorageId = result.storageId;
    }

    setIsGenerating(false);

    const parent = file.convexId
      ? { imageId: file.convexId as Id<"images">, fileName: crypto.randomUUID() }
      : { fileName: crypto.randomUUID() };

    const jobId = await createJob({
      sourceStorageId,
      fileName: crypto.randomUUID(),
      parent,
    });

    void processJob({ jobId, ...(apiKey ? { apiKey } : {}) });

    onClose();
    void navigate({ to: "/takes" });
  };

  return { trigger, isGenerating };
}
