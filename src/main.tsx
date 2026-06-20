import { BASE_PATH, CONVEX_URL } from "@config";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

if (import.meta.env.DEV) {
  void import("react-scan").then(({ scan }) => {
    scan({ enabled: true });
  });
}

const convex = new ConvexReactClient(CONVEX_URL);

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
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexAuthProvider>,
  );
}
