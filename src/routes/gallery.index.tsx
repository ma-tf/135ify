import { GalleryPage } from "@features/gallery/gallery-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery/")({
  component: GalleryPage,
});
