import { Outlet, createRootRoute } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/use-theme";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useTheme();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-stone-900 dark:text-stone-100">135ify</h1>
          <span className="text-stone-600 dark:text-stone-400">
            Give your digital images a filmic look
          </span>
        </div>
        <ThemeToggle />
      </div>
      <div className="text-stone-900 dark:text-stone-100">
        <Outlet />
      </div>
    </>
  );
}
