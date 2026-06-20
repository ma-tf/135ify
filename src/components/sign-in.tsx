import { Button } from "@components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignIn() {
  const { signIn } = useAuthActions();
  return <Button onClick={() => void signIn("github")}>Sign in with GitHub</Button>;
}
