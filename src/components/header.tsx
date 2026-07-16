import { AiKeyDialog } from "@components/ai-key-dialog";
import { GitHubIcon } from "@components/github-icon";
import { ModeToggle } from "@components/mode-toggle";
import { SignInButtons } from "@components/sign-in-dialog";
import { useTheme } from "@components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Skeleton } from "@components/ui/skeleton";
import { UserMenu } from "@components/user-menu";
import { BASE_PATH, FEATURE_AI_GRAIN, FEATURE_SIGN_IN, FEATURE_SUBSCRIPTIONS } from "@config";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { getInitials } from "@lib/utils";
import { useTakesNotificationStore } from "@stores/takes-notification-store";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { CreditCardIcon, KeyIcon, LogOut, Menu } from "lucide-react";
import { useState } from "react";

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

function PricingLink() {
  return (
    <Link to="/pricing">
      {({ isActive }) => (
        <span
          className={
            isActive
              ? "text-sm font-medium text-foreground"
              : "text-sm text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          Pricing
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

function UserAvatar({
  user,
}: {
  user:
    | { status: "pending" }
    | {
        status: "success";
        data: { name?: string | null; image?: string | null; email?: string | null } | null;
      }
    | { status: "error" };
}) {
  if (user.status === "pending") return <Skeleton className="size-8 rounded-full" />;
  if (user.status !== "success") return null;
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarImage src={user.data?.image ?? undefined} alt={user.data?.name ?? undefined} />
        <AvatarFallback>{getInitials(user.data?.name, user.data?.email)}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{user.data?.name ?? user.data?.email ?? "?"}</span>
    </div>
  );
}

function KeyDialogSection({ hasAiSub }: { hasAiSub: boolean }) {
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  if (!FEATURE_AI_GRAIN) return null;
  return (
    <>
      <div className="mt-4">
        <span className="text-xs font-medium text-muted-foreground">Personal</span>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start pr-0 pl-0 text-muted-foreground"
          onClick={() => setKeyDialogOpen(true)}
        >
          <KeyIcon className="size-4" />
          API Key
        </Button>
      </div>
      {keyDialogOpen && <AiKeyDialog onOpenChange={setKeyDialogOpen} hasAiSub={hasAiSub} />}
      {FEATURE_SUBSCRIPTIONS && (
        <Link to="/account">
          {({ isActive }) => (
            <span
              className={
                isActive
                  ? "text-sm font-medium text-foreground"
                  : "text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              <CreditCardIcon className="mr-1.5 inline size-4" />
              Account
            </span>
          )}
        </Link>
      )}
    </>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();
  const { signOut } = useAuthActions();
  const location = useLocation();
  const user = useQuery({ query: api.users.current, args: {} });

  const subscriptionsResult = useQuery({ query: api.subscriptions.byUser, args: {} });
  const hasAiSub =
    FEATURE_SUBSCRIPTIONS &&
    subscriptionsResult.status === "success" &&
    subscriptionsResult.data.some((s) => s.productKeys.includes("ai_generation_platform"));

  return (
    <Popover key={location.pathname} open={open} onOpenChange={setOpen}>
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
        <UserAvatar user={user} />
        <nav className="mt-4 flex flex-col gap-3">
          <FilmStripLink />
          <GalleryLink />
          {FEATURE_AI_GRAIN && <TakesLink />}
          {FEATURE_SUBSCRIPTIONS && <PricingLink />}
        </nav>
        <KeyDialogSection hasAiSub={hasAiSub} />
        <div className="mt-4">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <div className="mt-2 flex flex-col gap-1">
            <Button
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => setTheme("system")}
            >
              System
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start pr-0 pl-0 text-destructive"
            onClick={() => void signOut()}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
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
            src={`${BASE_PATH}assets/icon-d.png`}
            alt="135ify"
            className="hidden h-6 w-6 shadow-sm transition-all hover:brightness-125 dark:block"
          />
          <img
            src={`${BASE_PATH}assets/icon-l.png`}
            alt="135ify"
            className="h-6 w-6 shadow-sm transition-all hover:brightness-125 dark:hidden"
          />
        </Link>
      </div>
      {FEATURE_SIGN_IN && isAuthenticated && (
        <nav className="hidden items-center justify-center gap-6 md:flex">
          <FilmStripLink />
          <GalleryLink />
          {FEATURE_AI_GRAIN && <TakesLink />}
          {FEATURE_SUBSCRIPTIONS && <PricingLink />}
        </nav>
      )}
      <div className="flex items-center justify-end gap-2">
        <a href="https://m4t.tf" className="opacity-70 transition-opacity hover:opacity-100">
          <img src="/assets/logo64x64.webp" alt="135ify" className="size-5" />
          <span className="sr-only">Home</span>
        </a>
        <a
          href="https://github.com/ma-tf/135ify"
          target="_blank"
          rel="noopener noreferrer"
          className="mr-2 opacity-70 transition-opacity hover:text-foreground hover:opacity-100"
        >
          <GitHubIcon className="size-5" />
          <span className="sr-only">GitHub</span>
        </a>
        {FEATURE_SIGN_IN && isAuthenticated && <MobileNav />}
        {FEATURE_SIGN_IN && (
          <>
            <SignInButtons />
            {isAuthenticated && (
              <div className="hidden items-center md:flex">
                <UserMenu />
              </div>
            )}
          </>
        )}
        {FEATURE_SIGN_IN && isAuthenticated ? null : <ModeToggle />}
      </div>
    </div>
  );
}
