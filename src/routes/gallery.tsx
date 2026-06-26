import { useAuth } from "@hooks/use-auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
  component: GalleryLayout,
});

function GalleryLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated) throw redirect({ to: "/" });
  if (isLoading) return null;

  return <Outlet />;
}
