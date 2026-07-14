import { AiKeyForm } from "@components/ai-key-form";
import { Skeleton } from "@components/ui/skeleton";
import { FEATURE_AI_GRAIN } from "@config";
import { ActiveSubscriptions } from "@features/account/active-subscriptions";
import { ManageSubscriptionButton } from "@features/account/manage-subscription-button";
import { useSubscriptions } from "@features/account/use-subscriptions";
import { ShoppingBag } from "lucide-react";

export function AccountPage() {
  const { status, subscription, activePlans, plans } = useSubscriptions();

  if (status === "pending") {
    return <SubscriptionsSkeleton />;
  }

  if (status === "error") {
    return <SubscriptionsError />;
  }

  const hasAiSub = activePlans.some((p) => p.key === "ai_generation_platform");

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <p className="text-sm text-muted-foreground">Manage your plan subscriptions and billing.</p>
        <div className="mt-4 space-y-4">
          {subscription ? (
            <ActiveSubscriptions
              subscription={subscription}
              activePlans={activePlans}
              plans={plans}
            />
          ) : (
            <EmptySubscriptions />
          )}
        </div>
      </div>
      {subscription && <ManageSubscriptionButton />}
      {FEATURE_AI_GRAIN && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">API Key</h2>
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
          <AiKeyForm hasAiSub={hasAiSub} />
        </section>
      )}
    </>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function SubscriptionsError() {
  return <p className="text-sm text-destructive">Failed to load subscription data.</p>;
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
