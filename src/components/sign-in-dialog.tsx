import { GitHubIcon, GoogleIcon, XIcon } from "@components/auth-icon";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInDialog({
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
