import { AiKeyForm } from "@components/ai-key-form";
import { Skeleton } from "@components/ui/skeleton";
import { FEATURE_AI_GRAIN } from "@config";
import { ActiveSubscriptions } from "@features/account/active-subscriptions";
import { ManageSubscriptionButton } from "@features/account/manage-subscription-button";
import { useSubscriptions } from "@features/account/use-subscriptions";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

export function AccountPage() {
  const subs = useSubscriptions();

  const hasAiSub =
    subs.status === "success" && subs.activePlans.some((p) => p.key === "ai_generation_platform");

  return (
    <>
      <SubscriptionsSection subs={subs} />
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

function SubscriptionsSection({ subs }: { subs: ReturnType<typeof useSubscriptions> }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Subscriptions</h2>
      <p className="text-sm text-muted-foreground">Manage your plan subscriptions and billing.</p>
      <div className="mt-4 space-y-4">
        {subs.status === "pending" && <SubscriptionsSkeleton />}
        {subs.status === "error" && <SubscriptionsError />}
        {subs.status === "success" && subs.subscriptions.length > 0 && (
          <>
            <ActiveSubscriptions
              subscriptions={subs.subscriptions}
              activePlans={subs.activePlans}
            />
            <ManageSubscriptionButton />
          </>
        )}
        {subs.status === "success" && subs.subscriptions.length === 0 && <EmptySubscriptions />}
      </div>
    </div>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="py-6 text-center">
      <Skeleton className="mx-auto mb-2 size-8 rounded-full" />
      <Skeleton className="mx-auto h-4 w-40" />
      <Skeleton className="mx-auto mt-2 h-4 w-16" />
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
      <Link to="/pricing" className="mt-2 inline-block text-sm text-primary hover:underline">
        View plans
      </Link>
    </div>
  );
}
