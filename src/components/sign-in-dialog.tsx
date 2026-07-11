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
import { Skeleton } from "@components/ui/skeleton";
import { Spinner } from "@components/ui/spinner";
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
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Sign in
            {pendingProvider !== null && <Spinner className="ml-2 inline-block size-4" />}
          </DialogTitle>
          <DialogDescription>Sign in to save and manage your images.</DialogDescription>
        </DialogHeader>
        <Button
          variant="outline"
          className="w-full"
          disabled={pendingProvider !== null}
          onClick={() => {
            setPendingProvider("github");
            void signIn("github");
          }}
        >
          <GitHubIcon className="mr-2 size-4" />
          Continue with GitHub
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={pendingProvider !== null}
          onClick={() => {
            setPendingProvider("google");
            void signIn("google");
          }}
        >
          <GoogleIcon className="mr-2 size-4" />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={pendingProvider !== null}
          onClick={() => {
            setPendingProvider("twitter");
            void signIn("twitter");
          }}
        >
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

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-8 w-20 shadow-xs" />
        <Skeleton className="h-8 w-20 shadow-xs" />
      </>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" className="shadow-xs" onClick={() => setSignInOpen(true)}>
        Sign in
      </Button>
      <Button variant="default" size="sm" className="shadow-xs" onClick={() => setSignInOpen(true)}>
        Sign up
      </Button>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
