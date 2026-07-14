import { Skeleton } from "@components/ui/skeleton";
import { useSubscriptions } from "@features/account/use-subscriptions";
import { PlanCard } from "@features/pricing/plan-card";
import { CircleAlert, PackageOpen } from "lucide-react";

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

function PlansEmpty() {
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
  const { status, activePlans, plans } = useSubscriptions();

  if (status === "pending") {
    return <PlanGridSkeleton />;
  }

  if (status === "error") {
    return <PricingError />;
  }

  if (plans.length === 0) {
    return <PlansEmpty />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard key={plan.key} plan={plan} activePlans={activePlans} />
      ))}
    </div>
  );
}
