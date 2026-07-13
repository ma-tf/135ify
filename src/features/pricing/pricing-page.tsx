import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { PlanCard, type Plan } from "@features/pricing/plan-card";
import { useAction, useQuery_experimental as useQuery } from "convex/react";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function PlanGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex flex-col justify-between rounded-lg border p-6 shadow-md">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function PricingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 p-12">
      <CircleAlert className="size-12 text-destructive" />
      <div className="space-y-1 text-center">
        <p className="font-semibold">Failed to load plans</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while fetching pricing. Please try again.
        </p>
      </div>
      <Button onClick={onRetry}>
        <RotateCcw className="mr-2 size-4" />
        Retry
      </Button>
    </div>
  );
}

export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const subscriptions = useQuery({ query: api.subscriptions.byUser, args: {} });
  const getPlanAction = useAction(api.stripe.getPlan);

  const fetchPlans = useCallback(() => {
    setPlansError(false);
    setPlansLoading(true);
    void getPlanAction()
      .then((results) => {
        setPlans(results as Plan[]);
        setPlansLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        toast.error("Failed to load plans");
        setPlansError(true);
        setPlansLoading(false);
      });
  }, [getPlanAction]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleRetry = useCallback(() => fetchPlans(), [fetchPlans]);

  const subscribedKeys = new Set(
    subscriptions.status === "success"
      ? subscriptions.data.reduce((keys: string[], s: any) => {
          if (s.status === "active" || s.status === "trialing") {
            keys.push(s.productKey);
          }
          return keys;
        }, [])
      : [],
  );

  if (plansLoading) {
    return <PlanGridSkeleton />;
  }

  if (plansError) {
    return <PricingError onRetry={handleRetry} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard key={plan.key} plan={plan} subscribedKeys={subscribedKeys} />
      ))}
    </div>
  );
}
