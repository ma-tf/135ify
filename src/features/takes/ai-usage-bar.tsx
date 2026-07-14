import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { useQuery_experimental as useQuery } from "convex/react";

export function AiUsageBarSkeleton() {
  return (
    <div className="w-full space-y-1 rounded-lg border p-4 shadow-md sm:w-xs">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

export function AiUsageBar() {
  const result = useQuery({ query: api.usage.getAiUsage, args: {} });
  if (result.status === "pending") return <AiUsageBarSkeleton />;
  if (result.status === "error") return null;

  const data = result.data;
  if (!data) return null;

  const { usedCents, limitCents, atLimit, resetsAt } = data;
  const percent = Math.min((usedCents / limitCents) * 100, 100);
  const usedDollars = (usedCents / 100).toFixed(2);
  const limitDollars = (limitCents / 100).toFixed(2);
  const resetsDate = new Date(resetsAt).toLocaleDateString();

  return (
    <div className="w-full space-y-1 rounded-lg border p-4 shadow-md sm:w-xs">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">AI generation</span>
        <span className="font-medium">
          ${usedDollars} of ${limitDollars} this month
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? "bg-destructive" : percent >= 90 ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {atLimit && (
        <p className="text-xs text-destructive">Monthly cap reached. Resets {resetsDate}.</p>
      )}
    </div>
  );
}
