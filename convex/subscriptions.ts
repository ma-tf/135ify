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

export const upsert = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    productKey: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
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
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId,
        productKey: args.productKey,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
  },
});

export const hasActive = internalQuery({
  args: { productKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("productKey"), args.productKey),
          q.and(
            q.neq(q.field("status"), "canceled"),
            q.neq(q.field("status"), "unpaid"),
            q.neq(q.field("status"), "incomplete_expired"),
          ),
        ),
      )
      .first();
    return {
      active: !!sub,
      currentPeriodEnd: sub?.currentPeriodEnd ?? undefined,
    };
  },
});

export const remove = internalMutation({
  args: { stripeSubscriptionId: v.string() },
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
