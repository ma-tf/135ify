import type { FunctionReturnType } from "convex/server";

import { Button } from "@components/ui/button";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { CheckIcon, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export type Plan = FunctionReturnType<typeof api.stripe.getPlan>[number];

function usePlanAction(planKey: string, activePlans: Plan[], hasSubscription: boolean) {
  const isSubscribed = activePlans.some((p) => p.key === planKey);
  const hasExistingSubscription = hasSubscription;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const addToSubscription = useAction(api.stripe.addToSubscription);

  const subscribe = useCallback(() => {
    setError(null);
    setIsPending(true);
    void createCheckoutSession({ productKey: planKey })
      .then((result) => {
        if (result.url) window.location.href = result.url;
      })
      .catch((err: Error) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setIsPending(false));
  }, [createCheckoutSession, planKey]);

  const addToPlan = useCallback(() => {
    setError(null);
    setIsPending(true);
    void addToSubscription({ productKey: planKey })
      .then((result) => {
        if (result.url) window.location.href = result.url;
      })
      .catch((err: Error) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setIsPending(false));
  }, [addToSubscription, planKey]);

  const action = isSubscribed ? null : hasExistingSubscription ? addToPlan : subscribe;
  const label = isSubscribed
    ? "Subscribed"
    : hasExistingSubscription
      ? "Add to My Plan"
      : "Subscribe";

  return { action, label, isPending, error, isSubscribed };
}

export function PlanCard({
  plan,
  activePlans,
  hasSubscription,
}: {
  plan: Plan;
  activePlans: Plan[];
  hasSubscription: boolean;
}) {
  const { action, label, isPending, error, isSubscribed } = usePlanAction(
    plan.key,
    activePlans,
    hasSubscription,
  );

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
            {label}
          </Button>
        ) : (
          <>
            <Button
              className="w-full"
              disabled={!plan.priceId || isPending}
              onClick={action ?? undefined}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                label
              )}
            </Button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
