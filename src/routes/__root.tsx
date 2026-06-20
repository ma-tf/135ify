import { ModeToggle } from "@components/mode-toggle";
import { ThemeProvider } from "@components/theme-provider";
import { convex } from "@lib/convex";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ZustandStorageProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <Outlet />
          </div>
        </ZustandStorageProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

function Header() {
  return (
    <div className="background flex items-center justify-between p-6 lg:p-8">
      <img
        src="assets/icon-d.png"
        alt="135ify"
        className="hidden h-6 w-6 transition-all hover:brightness-125 dark:block"
      />
      <img
        src="assets/icon-l.png"
        alt="135ify"
        className="h-6 w-6 transition-all hover:brightness-125 dark:hidden"
      />
      <ModeToggle />
    </div>
  );
}
