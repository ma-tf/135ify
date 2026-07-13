import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { getPlan } from "@config";
import { api } from "@convex/_generated/api";
import { useAction, useQuery_experimental as useQuery } from "convex/react";
import { Loader2, ShoppingBag } from "lucide-react";
import { useCallback, useState } from "react";

export function AccountPage() {
  const subscriptions = useQuery({ query: api.subscriptions.byUser, args: {} });

  if (subscriptions.status === "pending") {
    return <SubscriptionsSkeleton />;
  }

  const activeSubs =
    subscriptions.status === "success"
      ? subscriptions.data.filter((s: any) => s.status === "active" || s.status === "trialing")
      : [];

  return (
    <>
      <div className="rounded-lg border p-6 shadow-md">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <p className="text-sm text-muted-foreground">Manage your plan subscriptions and billing.</p>
        <div className="mt-4 space-y-4">
          {subscriptions.status === "error" ? (
            <SubscriptionsError />
          ) : activeSubs.length > 0 ? (
            <ActiveSubscriptions subs={activeSubs} />
          ) : (
            <EmptySubscriptions />
          )}
        </div>
      </div>
      {activeSubs.length > 0 && <ManageSubscriptionButton />}
    </>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-6 shadow-md">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function SubscriptionsError() {
  return <p className="text-sm text-destructive">Failed to load subscriptions.</p>;
}

function ActiveSubscriptions({ subs }: { subs: any[] }) {
  return subs.map((sub: any) => {
    const plan = getPlan(sub.productKey);
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

function EmptySubscriptions() {
  return (
    <div className="py-6 text-center">
      <ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground" />
      <p className="text-muted-foreground">No active subscriptions</p>
      <a href="/pricing" className="mt-2 inline-block text-sm text-primary hover:underline">
        View plans
      </a>
    </div>
  );
}

function ManageSubscriptionButton() {
  const [managing, setManaging] = useState(false);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const handleClick = useCallback(() => {
    setManaging(true);
    void createPortalSession({})
      .then((result) => {
        if (result.url) {
          window.location.href = result.url;
        }
      })
      .finally(() => setManaging(false));
  }, [createPortalSession]);

  return (
    <Button className="w-full" disabled={managing} onClick={handleClick}>
      {managing ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        "Manage Subscription"
      )}
    </Button>
  );
}
