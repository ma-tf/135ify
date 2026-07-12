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

  return <PricingPage />;
}
