import { AvatarImage, AvatarFallback, Avatar } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenu,
} from "@components/ui/dropdown-menu";
import { Skeleton } from "@components/ui/skeleton";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useConvexAuth, useQuery_experimental as useQuery } from "convex/react";
import { ImageIcon, LogOut } from "lucide-react";
import { type ComponentProps } from "react";

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
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/gallery">
            <ImageIcon className="mr-2 size-4" />
            My Images
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
