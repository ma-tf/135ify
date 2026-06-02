import { AspectRatio } from "@components/ui/aspect-ratio";
import { Button } from "@components/ui/button";
import { Slider } from "@components/ui/slider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex w-full flex-col justify-center">
      <div className="px--8 mx-auto w-2xl">
        <AspectRatio ratio={16 / 9} className="rounded-lg bg-orange-200"></AspectRatio>
        <div className="grid grid-cols-2 gap-4">
          <div className="">Vignette</div>
          <div className="flex">
            <Slider defaultValue={[33]} max={100} step={1} />
            100%
          </div>
          <div className="">Grain</div>
          <div className="flex">
            <Slider defaultValue={[67]} max={100} step={1} />
            100%
          </div>
        </div>
        <Button className="w-full">Process</Button>
      </div>
    </div>
  );
}
