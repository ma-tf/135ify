import { Button } from "@components/ui/button";
import { STRIPE_AI_PRICE_ID, STRIPE_STORAGE_PRICE_ID } from "@config";
import { api } from "@convex/_generated/api";
import { useAction, useQuery_experimental as useQuery } from "convex/react";
import { CheckIcon, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

const PLANS = [
  {
    key: "storage_paid",
    name: "Storage",
    price: "$2/mo",
    description: "More gallery space for your 135 scans.",
    features: ["360 images (up from 36)", "25 MB per file (up from 10 MB)", "~9 GB total storage"],
    priceId: STRIPE_STORAGE_PRICE_ID,
  },
  {
    key: "ai_generation_platform",
    name: "AI Generation",
    price: "$2/mo",
    description: "Platform-managed AI grain. No BYO key needed.",
    features: [
      "OpenAI-powered film grain generation",
      "No separate API key required",
      "Managed monthly usage allowance",
    ],
    priceId: STRIPE_AI_PRICE_ID,
  },
] as const;

export function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Plans & Pricing</h1>
        <p className="text-muted-foreground">Stackable subscriptions — buy only what you need.</p>
      </div>
      <PlanGrid />
      <p className="text-center text-sm text-muted-foreground">
        Manage your subscriptions and billing from your{" "}
        <a href="/account" className="text-primary hover:underline">
          account page
        </a>
        .
      </p>
    </div>
  );
}

function PlanGrid() {
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const subscriptions = useQuery({ query: api.subscriptions.byUser, args: {} });
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

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

  const handleSubscribe = useCallback(
    function handleSubscribe(plan: (typeof PLANS)[number]) {
      setSubscribing(plan.key);
      void createCheckoutSession({ priceId: plan.priceId })
        .then((result) => {
          if (result.url) {
            window.location.href = result.url;
          }
        })
        .finally(() => {
          setSubscribing(null);
        });
    },
    [createCheckoutSession],
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PLANS.map((plan) => {
        const isSubscribed = subscribedKeys.has(plan.key);
        const isPending = subscribing === plan.key;
        return (
          <div
            key={plan.key}
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
                  onClick={() => handleSubscribe(plan)}
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
      })}
    </div>
  );
}
