import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import Twitter from "@auth/core/providers/twitter";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google, Twitter],
});
