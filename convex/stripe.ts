"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { requireAuth } from "./lib";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getProductKey(priceId: string): string {
  const mapping: Record<string, string> = {};
  if (process.env.STRIPE_STORAGE_PRICE_ID) {
    mapping[process.env.STRIPE_STORAGE_PRICE_ID] = "storage_paid";
  }
  if (process.env.STRIPE_AI_PRICE_ID) {
    mapping[process.env.STRIPE_AI_PRICE_ID] = "ai_generation_platform";
  }
  const key = mapping[priceId];
  if (!key) throw new Error(`Unknown price ID: ${priceId}`);
  return key;
}

export const createCheckoutSession = action({
  args: { priceId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const productKey = getProductKey(args.priceId);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      subscription_data: { metadata: { convexUserId: userId, productKey } },
    });
    return { url: session.url };
  },
});

export const createPortalSession = action({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.runQuery(internal.stripeSync.getUserStripeInfo, { userId });
    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer ID found for this user");
    }
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.SITE_URL}/account`,
    });
    return { url: session.url };
  },
});
