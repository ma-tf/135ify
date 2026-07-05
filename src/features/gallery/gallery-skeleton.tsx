import { Skeleton } from "@components/ui/skeleton";
import { UsageBarSkeleton } from "@features/gallery/gallery-usage-bar";

export function GallerySkeleton() {
  return (
    <div className="space-y-4 p-6">
      <UsageBarSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
