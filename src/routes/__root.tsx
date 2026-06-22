import { Footer } from "@components/footer";
import { Header } from "@components/header";
import { ThemeProvider } from "@components/theme-provider";
import { Toaster } from "@components/ui/sonner";
import { useOfflineToast } from "@hooks/use-offline-toast";
import { StorageProvider } from "@providers/storage-provider";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useOfflineToast();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <StorageProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="relative flex flex-1 flex-col">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster />
        <TanStackRouterDevtools />
      </StorageProvider>
    </ThemeProvider>
  );
}
