import { getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";

export const current = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Client is not authenticated!");
    const user = await ctx.db.get(userId);
    return { name: user?.name, image: user?.image, email: user?.email };
  },
});
