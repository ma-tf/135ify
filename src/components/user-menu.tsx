import { AiKeyDialog } from "@components/ai-key-dialog";
import { useTheme } from "@components/theme-provider";
import { AvatarImage, AvatarFallback, Avatar } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@components/ui/dropdown-menu";
import { Skeleton } from "@components/ui/skeleton";
import { FEATURE_AI_GRAIN, FEATURE_SUBSCRIPTIONS } from "@config";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@hooks/use-auth";
import { getInitials } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { useQuery_experimental as useQuery } from "convex/react";
import { CreditCardIcon, ImageIcon, KeyIcon, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { type ComponentProps, useState } from "react";

function UserAvatar(props: ComponentProps<typeof Button>) {
  const user = useQuery({ query: api.users.current, args: {} });

  if (user.status === "pending") {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (user.status === "error") {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" className="relative size-8 rounded-full" {...props}>
      <Avatar size="sm">
        <AvatarImage src={user.data.image} alt={user.data.name} />
        <AvatarFallback>{getInitials(user.data.name, user.data.email)}</AvatarFallback>
      </Avatar>
    </Button>
  );
}

export function UserMenu() {
  const { isAuthenticated } = useAuth();
  const { signOut } = useAuthActions();
  const { setTheme } = useTheme();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UserAvatar />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Personal</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/gallery">
                <ImageIcon className="mr-2 size-4" />
                Gallery
              </Link>
            </DropdownMenuItem>
            {FEATURE_SUBSCRIPTIONS && (
              <DropdownMenuItem asChild>
                <Link to="/account">
                  <CreditCardIcon className="mr-2 size-4" />
                  Account
                </Link>
              </DropdownMenuItem>
            )}
            {FEATURE_AI_GRAIN && (
              <>
                <DropdownMenuItem onClick={() => setKeyDialogOpen(true)}>
                  <KeyIcon className="mr-2 size-4" />
                  API Key
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 size-4" />
              System
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {FEATURE_AI_GRAIN && keyDialogOpen && <AiKeyDialog onOpenChange={setKeyDialogOpen} />}
    </>
  );
}
