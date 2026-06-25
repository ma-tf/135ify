import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/gallery")({
  component: GalleryLayout,
});

function GalleryLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (!isAuthenticated) throw redirect({ to: "/" });
  if (isLoading) return null;

  return <Outlet />;
}
