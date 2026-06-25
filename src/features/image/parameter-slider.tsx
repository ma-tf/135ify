import { Label } from "@components/ui/label";
import { Slider } from "@components/ui/slider";
import { cn } from "@lib/utils";
import { useState, type ComponentProps } from "react";

export function ParameterSlider({
  label,
  value: propValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
} & Pick<ComponentProps<typeof Slider>, "min" | "max" | "step">) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayValue = dragValue ?? propValue;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Label className="w-20 shrink-0 text-muted-foreground">{label}</Label>
      <Slider
        value={[displayValue]}
        onValueChange={([v]) => {
          setDragValue(v);
          onValueChange(v);
        }}
        onValueCommit={() => setDragValue(null)}
        min={min}
        max={max}
        step={step}
      />
      <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">
        {displayValue}
      </span>
    </div>
  );
}
