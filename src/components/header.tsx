import { ModeToggle } from "@components/mode-toggle";
import { SignInButtons } from "@components/sign-in-dialog";
import { UserMenu } from "@components/user-menu";
import { FEATURE_SIGN_IN } from "@config";
import { useConvexAuth } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";

export function Header() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="background flex items-center justify-between p-6 lg:p-8">
      <Link to="/">
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
      </Link>
      <div className="flex items-center gap-4">
        {FEATURE_SIGN_IN && isAuthenticated && (
          <Link
            to="/gallery"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Gallery
          </Link>
        )}
        <div className="flex items-center gap-2">
          {FEATURE_SIGN_IN && (
            <>
              <SignInButtons />
              <UserMenu />
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
