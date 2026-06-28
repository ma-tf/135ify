import { Skeleton } from "@components/ui/skeleton";
import { useAuth } from "@hooks/use-auth";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
  component: GalleryLayout,
});

function GalleryLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-4">
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}
