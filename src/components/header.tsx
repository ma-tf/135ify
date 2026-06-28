import { ModeToggle } from "@components/mode-toggle";
import { SignInButtons } from "@components/sign-in-dialog";
import { UserMenu } from "@components/user-menu";
import { FEATURE_SIGN_IN } from "@config";
import { useAuth } from "@hooks/use-auth";
import { Link } from "@tanstack/react-router";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className={`background grid items-center p-6 lg:p-8 ${FEATURE_SIGN_IN && isAuthenticated ? "grid-cols-3" : "grid-cols-2"}`}
    >
      <div className="flex justify-start">
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
      </div>
      {FEATURE_SIGN_IN && isAuthenticated && (
        <nav className="flex items-center justify-center gap-6">
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
        </nav>
      )}
      <div className="flex items-center justify-end gap-2">
        {FEATURE_SIGN_IN && (
          <>
            <SignInButtons />
            <UserMenu />
          </>
        )}
        <ModeToggle />
      </div>
    </div>
  );
}
