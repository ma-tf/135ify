import type { Doc } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

import { api } from "@convex/_generated/api";
import { ShoppingBag } from "lucide-react";

type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

export function ActiveSubscriptions({
  subscription,
  activePlans,
  plans: _plans,
}: {
  subscription: Doc<"subscriptions">;
  activePlans: Plan[];
  plans: Plan[];
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        {activePlans.map((plan) => (
          <div key={plan.key} className="flex items-center gap-3">
            <ShoppingBag className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.price} · {plan.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <p className="text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd
            ? `Cancels ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
            : subscription.currentPeriodEnd
              ? `Renews ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
              : ""}
        </p>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
          {subscription.status}
        </span>
      </div>
    </div>
  );
}
