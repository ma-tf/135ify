import type { FunctionReturnType } from "convex/server";

import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ShoppingBag } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

export function ActiveSubscriptions({ subs }: { subs: any[] }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const getPlanAction = useAction(api.stripe.getPlan);

  const onFetchPlans = useEffectEvent(() => {
    void getPlanAction().then((results) => setPlans(results as Plan[]));
  });

  useEffect(() => {
    onFetchPlans();
  }, []);

  return subs.map((sub: any) => {
    const plan = plans.find((p) => p.key === sub.productKey);
    return (
      <div key={sub._id} className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{plan?.name ?? sub.productKey}</p>
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
        <span className="text-sm text-muted-foreground">{sub.status}</span>
      </div>
    );
  });
}
