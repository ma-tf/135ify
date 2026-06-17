import type { MouseEvent } from "react";

import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { SlidersIcon, XIcon } from "lucide-react";

export function CardActions({
  showActions,
  onEdit,
  onRemove,
}: {
  showActions: boolean;
  onEdit: (e: MouseEvent) => void;
  onRemove: (e: MouseEvent) => void;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center gap-2 transition-opacity",
        showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(e);
        }}
        variant="secondary"
        size="icon"
        className="size-8 rounded-full shadow-sm"
      >
        <SlidersIcon className="size-4" />
      </Button>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(e);
        }}
        variant="secondary"
        size="icon"
        className="size-8 rounded-full shadow-sm"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
