import { AspectRatio } from "@components/ui/aspect-ratio";
import { Button } from "@components/ui/button";
import { Field, FieldDescription, FieldTitle } from "@components/ui/field";
import { Slider } from "@components/ui/slider";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex w-full flex-col justify-center">
      <div className="mx-auto w-2xl">
        <Dropzone />
        <ControlPanel />
      </div>
    </div>
  );
}

function Dropzone() {
  return <AspectRatio ratio={16 / 9} className="rounded-lg bg-orange-200"></AspectRatio>;
}

function ControlPanel() {
  return (
    <div className="flex flex-col gap-6">
      <Vignette />
      <Grain />
      <Button className="w-full">Process</Button>
    </div>
  );
}

function Vignette() {
  const [intensity, setIntensity] = useState([0, 100]);
  const [feather, setFeather] = useState([0, 100]);

  return (
    <Field className="w-full max-w-xs">
      <FieldTitle>Vignette</FieldTitle>
      <div className="flex flex-col gap-2">
        <FieldDescription>Set the intensity</FieldDescription>
        <Slider
          value={intensity}
          onValueChange={(value) => setIntensity(value as [number, number])}
          max={100}
          min={0}
          step={1}
          className="mt-2 w-full"
          aria-label="Vignette intensity"
        />
        <FieldDescription>Set the feather</FieldDescription>
        <Slider
          value={feather}
          onValueChange={(value) => setFeather(value as [number, number])}
          max={100}
          min={0}
          step={1}
          className="mt-2 w-full"
          aria-label="Vignette feather"
        />
      </div>
    </Field>
  );
}

function Grain() {
  const [grain, setGrain] = useState([0, 100]);

  return (
    <Field className="w-full max-w-xs">
      <FieldTitle>Vignette</FieldTitle>
      <div className="flex flex-col gap-2">
        <FieldDescription>Set the intensity</FieldDescription>
        <Slider
          value={grain}
          onValueChange={(value) => setGrain(value as [number, number])}
          max={100}
          min={0}
          step={1}
          className="mt-2 w-full"
          aria-label="Grain"
        />
      </div>
    </Field>
  );
}
