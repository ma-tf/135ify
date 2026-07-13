"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { requireAuth } from "./lib";

export type ProductKey = "storage_paid" | "ai_generation_platform";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getProductKey(priceId: string): ProductKey {
  const mapping: Record<string, ProductKey> = {};
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

export const getPlan = action({
  args: {},
  handler: async (_ctx) => {
    const stripe = getStripe();
    const priceIds = [process.env.STRIPE_STORAGE_PRICE_ID, process.env.STRIPE_AI_PRICE_ID].filter(
      Boolean,
    ) as string[];

    if (priceIds.length === 0) {
      return [];
    }

    const prices = await Promise.all(
      priceIds.map((id) => stripe.prices.retrieve(id, { expand: ["product"] })),
    );

    return prices.map((price) => {
      const product = price.product as Stripe.Product;
      const amount = (price.unit_amount ?? 0) / 100;
      const interval = price.recurring?.interval ?? "month";
      const displayPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
      return {
        key: getProductKey(price.id),
        name: product.name,
        price: `${displayPrice}/${interval}`,
        description: product.description ?? "",
        priceId: price.id,
        features: product.marketing_features?.flatMap((f) => (f.name ? [f.name] : [])) ?? [],
      };
    });
  },
});

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
