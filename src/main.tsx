import { BASE_PATH } from "@config";
import { ConvexProvider } from "@providers/convex-provider";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

if (import.meta.env.DEV) {
  void import("react-scan").then(({ scan }) => {
    scan({ enabled: true });
  });
}

// Set up a Router instance
const router = createRouter({
  routeTree,
  basepath: BASE_PATH,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ConvexProvider>
      <RouterProvider router={router} />
    </ConvexProvider>,
  );
}
