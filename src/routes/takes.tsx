import { FEATURE_AI_GRAIN } from "@config";
import { TakesSkeleton } from "@features/takes/takes-skeleton";
import { useAuth } from "@hooks/use-auth";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/takes")({
  component: TakesLayout,
});

function TakesLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <TakesSkeleton />;
  }

  if (!isAuthenticated || !FEATURE_AI_GRAIN) {
    void navigate({ to: "/", replace: true });
    return null;
  }

  return <Outlet />;
}
