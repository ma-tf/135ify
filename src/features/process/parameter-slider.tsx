import type { ComponentProps } from "react";

import { Slider } from "@components/ui/slider";
import { cn } from "@lib/utils";

export function ParameterSlider({
  label,
  value,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  onValueCommit: (value: number) => void;
  className?: string;
} & Pick<ComponentProps<typeof Slider>, "min" | "max" | "step">) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        onValueCommit={([v]) => onValueCommit(v)}
        min={min}
        max={max}
        step={step}
      />
      <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}
