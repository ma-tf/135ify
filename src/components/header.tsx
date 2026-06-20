import { ModeToggle } from "@components/mode-toggle";
import { SignInDialog } from "@components/sign-in-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { FEATURE_SIGN_IN } from "@config";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOut, ImageIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../convex/_generated/api";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function HeaderAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current);
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      {FEATURE_SIGN_IN && !isLoading && !isAuthenticated && (
        <>
          <Button variant="outline" size="sm" onClick={() => setSignInOpen(true)}>
            Sign in
          </Button>
          <Button variant="default" size="sm" onClick={() => setSignInOpen(true)}>
            Sign up
          </Button>
        </>
      )}
      {isAuthenticated && user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative size-8 rounded-full">
              <Avatar size="sm">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href="/images">
                <ImageIcon className="mr-2 size-4" />
                My Images
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
