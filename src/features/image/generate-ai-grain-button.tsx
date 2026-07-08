import type { Id } from "@convex/_generated/dataModel";

import { AiKeyDialog } from "@components/ai-key-dialog";
import { OverQuotaDialog } from "@components/over-quota-dialog";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { FEATURE_AI_GRAIN } from "@config";
import { api } from "@convex/_generated/api";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { useAuth } from "@hooks/use-auth";
import { useFile } from "@providers/file-context";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function GenerateAiGrainButton({ context }: { context: "upload" | "gallery" }) {
  const { isAuthenticated } = useAuth();
  const file = useFile();
  const navigate = useNavigate();
  const onClose = useEditViewClose();
  const { apiKey } = useAiProviderStore();
  const generate = useAction(api.aiGeneration.generate);
  const generateFromBase64 = useAction(api.aiGeneration.generateFromBase64);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [overQuotaBase64, setOverQuotaBase64] = useState<string | null>(null);

  if (!FEATURE_AI_GRAIN) return null;
  if (!isAuthenticated) return null;

  const handleResult = (result: { status: string; base64?: string; imageId?: string }) => {
    if (result.status === "stored" && result.imageId) {
      onClose();
      toast.success(
        <span className="flex gap-1">
          Image queued.
          <Link to="/takes" className="underline underline-offset-2">
            View status
          </Link>
        </span>,
      );
      void navigate({ to: "/takes" });
    } else if (result.status === "overQuota") {
      setOverQuotaBase64(result.base64!);
    }
  };

  const handleGalleryClick = async (key: string) => {
    return generate({
      sourceImageId: file.id as Id<"images">,
      apiKey: key,
    });
  };

  const handleUploadClick = async (key: string) => {
    const response = await fetch(file.sourceUrl);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return generateFromBase64({ sourceBase64: base64, sourceFileName: file.fileName, apiKey: key });
  };

  const runGeneration = async (key: string) => {
    setIsGenerating(true);
    const run = context === "gallery" ? handleGalleryClick : handleUploadClick;
    try {
      const result = await run(key);
      handleResult(result);
    } catch (err) {
      console.error("AI generation failed:", err);
      toast.error("AI generation failed");
    }
    setIsGenerating(false);
  };

  const handleClick = async () => {
    if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    }
    await runGeneration(apiKey);
  };

  return (
    <>
      <Button disabled={isGenerating} size="sm" className="gap-1.5" onClick={handleClick}>
        {isGenerating ? <Spinner className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
        Generate AI Film Grain
      </Button>
      {keyDialogOpen && <AiKeyDialog onOpenChange={setKeyDialogOpen} onSave={runGeneration} />}
      {overQuotaBase64 && (
        <OverQuotaDialog base64={overQuotaBase64} onDiscard={() => setOverQuotaBase64(null)} />
      )}
    </>
  );
}
