import { Skeleton } from "@components/ui/skeleton";

export function TakesSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 rounded-lg border p-3 shadow-md">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
