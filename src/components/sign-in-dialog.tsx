import { GitHubIcon } from "@components/github-icon";
import { GoogleIcon } from "@components/google-icon";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { XIcon } from "@components/x-icon";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "@hooks/use-auth";
import { useState } from "react";

function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { signIn } = useAuthActions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Sign in to save and manage your images.</DialogDescription>
        </DialogHeader>
        <Button variant="outline" className="w-full" onClick={() => signIn("github")}>
          <GitHubIcon className="mr-2 size-4" />
          Continue with GitHub
        </Button>
        <Button variant="outline" className="w-full" onClick={() => signIn("google")}>
          <GoogleIcon className="mr-2 size-4" />
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full" onClick={() => signIn("twitter")}>
          <XIcon className="mr-2 size-4" />
          Continue with X
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function SignInButtons() {
  const { isAuthenticated, isLoading } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setSignInOpen(true)}>
        Sign in
      </Button>
      <Button variant="default" size="sm" onClick={() => setSignInOpen(true)}>
        Sign up
      </Button>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
