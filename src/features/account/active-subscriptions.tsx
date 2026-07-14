import type { FunctionReturnType } from "convex/server";

import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ShoppingBag } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

export function ActiveSubscriptions({ subs }: { subs: any[] }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const getPlanAction = useAction(api.stripe.getPlan);

  const onFetchPlans = useEffectEvent(() => {
    void getPlanAction().then((results) => {
      setPlans(results as Plan[]);
      setPlansLoading(false);
    });
  });

  useEffect(() => {
    onFetchPlans();
  }, []);

  if (plansLoading) {
    return subs.map((sub: any) => (
      <div key={sub._id} className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-5" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    ));
  }

  return subs.map((sub: any) => {
    const plan = plans.find((p) => p.key === sub.productKey);
    return (
      <div key={sub._id} className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{plan?.name}</p>
            <p className="text-sm text-muted-foreground">
              {plan ? `${plan.price} · ${plan.description}` : ""}
              {sub.cancelAtPeriodEnd && sub.currentPeriodEnd
                ? ` · Cancels ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`
                : sub.currentPeriodEnd
                  ? ` · Renews ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`
                  : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {sub.status}
        </span>
      </div>
    );
  });
}
