import { FEATURE_SUBSCRIPTIONS } from "@config";
import { PricingPage } from "@features/pricing/pricing-page";
import { useAuth } from "@hooks/use-auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: PricingRoute,
  head: () => ({ meta: [{ title: "135ify | Pricing" }] }),
});

function PricingRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!FEATURE_SUBSCRIPTIONS) {
    void navigate({ to: "/", replace: true });
    return null;
  }
  if (isLoading) return null;
  if (!isAuthenticated) {
    void navigate({ to: "/", replace: true });
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Plans & Pricing</h1>
        <p className="text-muted-foreground">One plan, one bill — add the features you need.</p>
      </div>
      <PricingPage />
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
