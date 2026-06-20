import { Footer } from "@components/footer";
import { Header } from "@components/header";
import { ThemeProvider } from "@components/theme-provider";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ZustandStorageProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <Outlet />
          <Footer />
        </div>
      </ZustandStorageProvider>
    </ThemeProvider>
  );
}
