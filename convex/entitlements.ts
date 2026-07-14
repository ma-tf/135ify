import { v } from "convex/values";

import { internalQuery, query } from "./_generated/server";
import { requireAuth } from "./lib";

export const hasEntitlement = internalQuery({
  args: { entitlement: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const entitlements = await ctx.db
      .query("userEntitlements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return entitlements?.lookupKeys.includes(args.entitlement) ?? false;
  },
});

export const byUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("userEntitlements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});
