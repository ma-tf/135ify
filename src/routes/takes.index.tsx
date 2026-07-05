import { TakesPage } from "@features/takes/takes-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/takes/")({
  component: TakesPage,
  head: () => ({ meta: [{ title: "135ify | Takes" }] }),
});
