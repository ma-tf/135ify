import { FEATURE_SUBSCRIPTIONS } from "@config";
import { AccountPage } from "@features/account/account-page";
import { useAuth } from "@hooks/use-auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

function AccountRoute() {
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
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">Account</h1>
      <AccountPage />
    </div>
  );
}

export const Route = createFileRoute("/account")({
  component: AccountRoute,
  head: () => ({ meta: [{ title: "135ify | Account" }] }),
});
