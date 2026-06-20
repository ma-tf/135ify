import { ModeToggle } from "@components/mode-toggle";
import { SignIn } from "@components/sign-in";
import { SignOut } from "@components/sign-out";
import { Authenticated, Unauthenticated } from "convex/react";

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
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <SignOut />
      </Authenticated>
      <ModeToggle />
    </div>
  );
}
