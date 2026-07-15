import { Skeleton } from "@components/ui/skeleton";
import { useSubscriptions } from "@features/account/use-subscriptions";
import { PlanCard } from "@features/pricing/plan-card";
import { CircleAlert, PackageOpen } from "lucide-react";

function PricingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-12">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-1 text-center">
        <Skeleton className="mx-auto h-5 w-36" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
    </div>
  );
}

function PricingError() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 p-12">
      <CircleAlert className="size-12 text-destructive" />
      <div className="space-y-1 text-center">
        <p className="font-semibold">Failed to load plans</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while fetching pricing.
        </p>
      </div>
    </div>
  );
}

function PricingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-12">
      <PackageOpen className="size-12 text-muted-foreground" />
      <div className="space-y-1 text-center">
        <p className="font-semibold">No plans available</p>
        <p className="text-sm text-muted-foreground">
          Check back soon for available pricing plans.
        </p>
      </div>
    </div>
  );
}

export function PricingPage() {
  const { status, activePlans, plans, hasSubscription } = useSubscriptions();

  if (status === "pending") {
    return <PricingSkeleton />;
  }

  if (status === "error") {
    return <PricingError />;
  }

  if (plans.length === 0) {
    return <PricingEmpty />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard
          key={plan.key}
          plan={plan}
          activePlans={activePlans}
          hasSubscription={hasSubscription}
        />
      ))}
    </div>
  );
}
