import { getAuthUserId } from "@convex-dev/auth/server";

import { mutation, type ActionCtx, type MutationCtx, type QueryCtx } from "./_generated/server";

export function formatDate(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
