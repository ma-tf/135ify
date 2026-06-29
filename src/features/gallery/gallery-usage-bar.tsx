import { Skeleton } from "@components/ui/skeleton";
import { formatBytes } from "@lib/utils";

export type StorageUsage = {
  usedBytes: number;
  imageCount: number;
  imageLimit: number;
  storageLimitBytes: number;
};

export function UsageBarSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-full space-y-1 rounded-lg border p-4 sm:w-xs">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="w-full space-y-1 rounded-lg border p-4 sm:w-xs">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

export function UsageBar({ data }: { data: StorageUsage }) {
  const imagePercent = Math.min((data.imageCount / data.imageLimit) * 100, 100);
  const storagePercent = Math.min((data.usedBytes / data.storageLimitBytes) * 100, 100);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-full space-y-1 rounded-lg border p-4 sm:w-xs">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Images</span>
          <span className="font-medium">
            {data.imageCount} of {data.imageLimit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${imagePercent}%` }}
          />
        </div>
      </div>
      <div className="w-full space-y-1 rounded-lg border p-4 sm:w-xs">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-medium">
            {formatBytes(data.usedBytes)} of {formatBytes(data.storageLimitBytes)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
