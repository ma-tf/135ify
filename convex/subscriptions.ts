import { v } from "convex/values";

import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireAuth } from "./lib";

export const byUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const hasProductKey = internalQuery({
  args: { productKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return subscriptions.some((sub) => sub.productKeys.includes(args.productKey));
  },
});

export const upsert = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    productKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
        .first();
      if (!user) return;
      userId = user._id;
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAt: args.cancelAt,
        productKeys: args.productKeys,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        ...(args.cancelAt !== undefined ? { cancelAt: args.cancelAt } : {}),
        productKeys: args.productKeys,
      });
    }
  },
});

export const remove = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
