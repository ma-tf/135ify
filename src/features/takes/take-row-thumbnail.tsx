import { Skeleton } from "@components/ui/skeleton";
import { Link } from "@tanstack/react-router";

type TakeStatus = "processing" | "completed" | "failed" | "overQuota";

export type TakeRowJob = {
  _id: string;
  _creationTime: number;
  fileName: string;
  status: TakeStatus;
  failureReason?: string | null;
  thumbnailBase64?: string | null;
  takeImageId?: string | null;
  takeImageUrl?: string | null;
  overQuotaStorageId?: string | null;
};

export function TakeRowThumbnail({
  status,
  thumbnailBase64,
  takeImageId,
  fileName,
  overQuotaStorageId,
  onOverQuotaClick,
}: {
  status: TakeStatus;
  thumbnailBase64: string | null | undefined;
  takeImageId: string | null | undefined;
  fileName: string;
  overQuotaStorageId?: string | null;
  onOverQuotaClick?: () => void;
}) {
  if (status === "completed" && thumbnailBase64 && takeImageId) {
    return (
      <Link to="/gallery/$imageId" params={{ imageId: takeImageId }}>
        <img
          src={`data:image/jpeg;base64,${thumbnailBase64}`}
          alt={fileName}
          className="h-16 w-16 rounded object-cover"
        />
      </Link>
    );
  }

  if (status === "overQuota" && thumbnailBase64) {
    if (overQuotaStorageId && onOverQuotaClick) {
      return (
        <button type="button" onClick={onOverQuotaClick} className="cursor-pointer">
          <img
            src={`data:image/jpeg;base64,${thumbnailBase64}`}
            alt={fileName}
            className="h-16 w-16 rounded object-cover"
          />
        </button>
      );
    }
    return (
      <img
        src={`data:image/jpeg;base64,${thumbnailBase64}`}
        alt={fileName}
        className="h-16 w-16 rounded object-cover opacity-50"
      />
    );
  }

  return <Skeleton className="h-16 w-16 rounded" />;
}
