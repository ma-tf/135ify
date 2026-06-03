import { ModeToggle } from "@components/mode-toggle";
import { ThemeProvider } from "@components/theme-provider";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex min-h-screen flex-col">
        <Header />
        <Outlet />
      </div>
    </ThemeProvider>
  );
}

function Header() {
  return (
    <div className="background flex items-center justify-between p-6 lg:p-8">
      <h1 className="text-2xl text-foreground">135ify</h1>
      <ModeToggle />
    </div>
  );
}
