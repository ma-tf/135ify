import { ModeToggle } from "@components/mode-toggle";
import { SignInDialog } from "@components/sign-in-dialog";
import { SignOut } from "@components/sign-out";
import { Button } from "@components/ui/button";
import { FEATURE_SIGN_IN } from "@config";
import { useConvexAuth } from "@convex-dev/auth/react";
import { LogInIcon } from "lucide-react";
import { useState } from "react";

function HeaderAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      {FEATURE_SIGN_IN && !isLoading && !isAuthenticated && (
        <Button variant="outline" size="sm" onClick={() => setSignInOpen(true)}>
          <LogInIcon className="mr-1.5 size-3.5" />
          Sign in
        </Button>
      )}
      {isAuthenticated && <SignOut />}
      {FEATURE_SIGN_IN && <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />}
    </>
  );
}

export function Header() {
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
      <div className="flex items-center gap-2">
        {FEATURE_SIGN_IN && <HeaderAuth />}
        <ModeToggle />
      </div>
    </div>
  );
}
