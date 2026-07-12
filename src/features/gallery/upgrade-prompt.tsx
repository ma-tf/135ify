import { Button } from "@components/ui/button";
import { FEATURE_SUBSCRIPTIONS } from "@config";
import { api } from "@convex/_generated/api";
import { useQuery_experimental as useQuery } from "convex/react";
import { CrownIcon } from "lucide-react";

export function UpgradePrompt() {
  const storageResult = useQuery({ query: api.images.getStorageUsage, args: {} });

  if (!FEATURE_SUBSCRIPTIONS) return null;

  if (storageResult.status !== "success") return null;

  const { atLimit, tier } = storageResult.data;
  if (!atLimit || tier !== "free") return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CrownIcon className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">You've reached the free-tier limit</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to Storage ($2/mo) for more space and larger files.
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <a href="/pricing">Upgrade</a>
        </Button>
      </div>
    </div>
  );
}
