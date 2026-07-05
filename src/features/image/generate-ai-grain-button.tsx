import type { Id } from "@convex/_generated/dataModel";

import { AiKeyDialog } from "@components/ai-key-dialog";
import { OverQuotaDialog } from "@components/over-quota-dialog";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { FEATURE_AI_GRAIN } from "@config";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { useFile } from "@providers/file-context";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function GenerateAiGrainButton() {
  const { isAuthenticated } = useAuth();
  const file = useFile();
  const { apiKey } = useAiProviderStore();
  const generate = useAction(api.aiGeneration.generate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [overQuotaBase64, setOverQuotaBase64] = useState<string | null>(null);

  if (!FEATURE_AI_GRAIN) return null;
  if (!isAuthenticated) return null;

  const handleClick = async () => {
    if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generate({
        sourceImageId: file.id as Id<"images">,
        apiKey,
      });
      if (result.status === "stored") {
        toast.success(
          <span className="flex gap-1">
            AI generation complete.
            <Link to="/takes" className="underline underline-offset-2">
              View Takes
            </Link>
          </span>,
        );
      } else if (result.status === "overQuota") {
        setOverQuotaBase64(result.base64);
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      toast.error("AI generation failed");
    }
    setIsGenerating(false);
  };

  return (
    <>
      <Button disabled={isGenerating} size="sm" className="gap-1.5" onClick={handleClick}>
        {isGenerating ? <Spinner className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
        Generate AI Film Grain
      </Button>
      {keyDialogOpen && <AiKeyDialog onOpenChange={setKeyDialogOpen} />}
      {overQuotaBase64 && (
        <OverQuotaDialog base64={overQuotaBase64} onDiscard={() => setOverQuotaBase64(null)} />
      )}
    </>
  );
}
