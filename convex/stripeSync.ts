import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";

import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";

export const getUserStripeInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

function parseStatus(status: string): "active" | "inactive" | undefined {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired")
    return "inactive";
  return undefined;
}

export async function handleSyncSubscription(
  ctx: MutationCtx,
  stripeCustomerId: string,
  status: string,
  metadata: Record<string, unknown> | undefined,
) {
  const convexUserId = metadata?.convexUserId as Id<"users"> | undefined;

  const user = convexUserId
    ? await ctx.db.get(convexUserId)
    : await ctx.db
        .query("users")
        .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", stripeCustomerId))
        .first();

  if (!user) return;

  const parsed = parseStatus(status);
  const subscriptionStatus = parsed === "inactive" ? undefined : status;

  await ctx.db.patch(user._id, {
    stripeCustomerId,
    subscriptionStatus,
  });
}

export const syncSubscription = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await handleSyncSubscription(ctx, args.stripeCustomerId, args.status, args.metadata);
  },
});

export async function handleSyncEntitlements(
  ctx: MutationCtx,
  stripeCustomerId: string,
  lookupKeys: string[],
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", stripeCustomerId))
    .first();
  if (!user) return;
  const existing = await ctx.db
    .query("userEntitlements")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, { lookupKeys, updated: Date.now() });
  } else {
    await ctx.db.insert("userEntitlements", {
      userId: user._id,
      lookupKeys,
      updated: Date.now(),
    });
  }
}

export const syncEntitlements = internalMutation({
  args: { stripeCustomerId: v.string(), lookupKeys: v.array(v.string()) },
  handler: async (ctx, args) => {
    await handleSyncEntitlements(ctx, args.stripeCustomerId, args.lookupKeys);
  },
});
