import type { FunctionReturnType } from "convex/server";

import { Button } from "@components/ui/button";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { CheckIcon, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

export type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

export function PlanCard({ plan, subscribedKeys }: { plan: Plan; subscribedKeys: Set<string> }) {
  const isSubscribed = subscribedKeys.has(plan.key);
  const [isPending, setIsPending] = useState(false);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const handleSubscribe = useCallback(() => {
    setIsPending(true);
    void createCheckoutSession({ priceId: plan.priceId })
      .then((result) => {
        if (result.url) {
          window.location.href = result.url;
        }
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [createCheckoutSession, plan.priceId]);

  return (
    <div
      className={`flex flex-col justify-between rounded-lg border p-6 shadow-md ${isSubscribed ? "border-primary" : ""}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          {isSubscribed && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Subscribed
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        <p className="mt-4 text-3xl font-bold">{plan.price}</p>
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon className="size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        {isSubscribed ? (
          <Button variant="outline" className="w-full" disabled>
            Subscribed
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!plan.priceId || isPending}
            onClick={handleSubscribe}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
