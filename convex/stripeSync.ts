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

export async function handleProvisionAccess(ctx: MutationCtx, stripeCustomerId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", stripeCustomerId))
    .first();
  if (!user) return;
  await ctx.db.patch(user._id, { storageTier: "paid" });
}

export async function handleRevokeAccess(ctx: MutationCtx, stripeCustomerId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", stripeCustomerId))
    .first();
  if (!user) return;
  await ctx.db.patch(user._id, { storageTier: "free" });
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

export const provisionAccess = internalMutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    await handleProvisionAccess(ctx, args.stripeCustomerId);
  },
});

export const revokeAccess = internalMutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    await handleRevokeAccess(ctx, args.stripeCustomerId);
  },
});
