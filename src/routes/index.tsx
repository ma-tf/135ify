import { ControlsPanel } from "@features/process/controls-panel";
import { RenderCarousel } from "@features/process/render-carousel";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center gap-6 lg:max-w-xl">
        <RenderCarousel />
      </div>
      <ControlsPanel />
    </main>
  );
}
