import { Skeleton } from "@components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";

import { GalleryCard } from "./gallery-card";

export function GalleryPage() {
  const result = useQuery({ query: api.images.listByUser, args: {} });

  if (result.status === "pending") {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (result.status === "error") {
    return null;
  }

  if (result.status === "success" && result.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">No saved images yet.</p>
        <Link to="/" className="text-primary hover:underline">
          Process your first image
        </Link>
      </div>
    );
  }

  if (result.status === "success") {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {result.data.map((image) => (
          <GalleryCard key={image._id} image={image} />
        ))}
      </div>
    );
  }

  return null;
}
