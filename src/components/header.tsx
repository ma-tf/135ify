import { ModeToggle } from "@components/mode-toggle";
import { SignInButtons } from "@components/sign-in-dialog";
import { useTheme } from "@components/theme-provider";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { UserMenu } from "@components/user-menu";
import { BASE_PATH, FEATURE_SIGN_IN } from "@config";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

function FilmStripLink() {
  return (
    <Link to="/">
      {({ isActive }) => (
        <span
          className={
            isActive
              ? "text-sm font-medium text-foreground"
              : "text-sm text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          Film Strip
        </span>
      )}
    </Link>
  );
}

function GalleryLink() {
  return (
    <Link to="/gallery">
      {({ isActive }) => (
        <span
          className={
            isActive
              ? "text-sm font-medium text-foreground"
              : "text-sm text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          Gallery
        </span>
      )}
    </Link>
  );
}

function TakesLink() {
  const location = useLocation();
  const lastSeenAt = useTakesNotificationStore((s) => s.lastSeenAt);
  const latestResult = useQuery({ query: api.aiGenerationJobs.latestJobTimestamp, args: {} });
  const latestTimestamp = latestResult.status === "success" ? latestResult.data : null;

  const isOnTakes = location.pathname.startsWith("/takes");
  const showDot =
    !isOnTakes &&
    latestTimestamp != null &&
    (lastSeenAt == null || latestTimestamp._creationTime > lastSeenAt);

  return (
    <Link to="/takes">
      {({ isActive }) => (
        <span className="relative">
          <span
            className={
              isActive
                ? "text-sm font-medium text-foreground"
                : "text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            Takes
          </span>
          {showDot && (
            <span className="absolute -top-0.5 -right-2 size-2 rounded-full bg-primary" />
          )}
        </span>
      )}
    </Link>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="mr-2 size-4" />
          Menu
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="w-screen max-w-none rounded-none border-x-0 px-6 py-4"
      >
        <nav className="flex flex-col gap-3">
          <FilmStripLink />
          <GalleryLink />
          <TakesLink />
        </nav>
        <div className="mt-4 flex flex-col gap-2 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setTheme("light")}>
              Light
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTheme("dark")}>
              Dark
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTheme("system")}>
              System
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className={`background grid items-center p-6 lg:p-8 ${FEATURE_SIGN_IN && isAuthenticated ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}
    >
      <div className="flex justify-start">
        <Link to="/">
          <img
            src={`${BASE_PATH}/assets/icon-d.png`}
            alt="135ify"
            className="hidden h-6 w-6 transition-all hover:brightness-125 dark:block"
          />
          <img
            src={`${BASE_PATH}/assets/icon-l.png`}
            alt="135ify"
            className="h-6 w-6 transition-all hover:brightness-125 dark:hidden"
          />
        </Link>
      </div>
      {FEATURE_SIGN_IN && isAuthenticated && (
        <nav className="hidden items-center justify-center gap-6 md:flex">
          <FilmStripLink />
          <GalleryLink />
          <TakesLink />
        </nav>
      )}
      <div className="flex items-center justify-end gap-2">
        {FEATURE_SIGN_IN && isAuthenticated && <MobileNav />}
        {FEATURE_SIGN_IN && (
          <>
            <SignInButtons />
            <UserMenu />
          </>
        )}
        {FEATURE_SIGN_IN && isAuthenticated ? (
          <span className="hidden md:block">
            <ModeToggle />
          </span>
        ) : (
          <ModeToggle />
        )}
      </div>
    </div>
  );
}
