import { RenderCarousel } from "@features/process/render-carousel";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <div className="mx-auto flex w-full min-w-0 flex-col items-center justify-center px-8">
        <RenderCarousel />
      </div>
    </main>
  );
}
