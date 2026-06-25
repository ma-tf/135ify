import type { ComponentProps } from "react";

import { Label } from "@components/ui/label";
import { Slider } from "@components/ui/slider";
import { cn } from "@lib/utils";
import { useRef, useState } from "react";

export function ParameterSlider({
  label,
  value,
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
  const [liveValue, setLiveValue] = useState(value);
  const committedValueRef = useRef(value);

  if (value !== committedValueRef.current) {
    committedValueRef.current = value;
    setLiveValue(value);
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Label className="w-20 shrink-0 text-muted-foreground">{label}</Label>
      <Slider
        value={[liveValue]}
        onValueChange={([v]) => {
          setLiveValue(v);
          onValueChange(v);
        }}
        min={min}
        max={max}
        step={step}
      />
      <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">{liveValue}</span>
    </div>
  );
}
