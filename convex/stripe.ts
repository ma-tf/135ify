"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { SITE_URL, STRIPE_SECRET_KEY } from "./config";
import { requireAuth } from "./lib";

function getStripe() {
  return new Stripe(STRIPE_SECRET_KEY);
}

export const getPlan = action({
  args: {},
  handler: async (_ctx) => {
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true,
      type: "recurring",
      limit: 50,
    });

    return prices.data.flatMap((price) => {
      if (!price.lookup_key || !price.unit_amount) return [];
      const product = price.product as Stripe.Product;
      const amount = price.unit_amount / 100;
      const interval = price.recurring?.interval ?? "month";
      const displayPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
      return [
        {
          key: price.lookup_key,
          name: product.name,
          price: `${displayPrice}/${interval}`,
          description: product.description ?? "",
          priceId: price.id,
          features: product.marketing_features?.flatMap((f) => (f.name ? [f.name] : [])) ?? [],
        },
      ];
    });
  },
});

export const createCheckoutSession = action({
  args: { productKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.runQuery(internal.stripeSync.getUserStripeInfo, { userId });

    const existingSubs = await ctx.runQuery(api.subscriptions.byUser, {});
    const hasExisting = existingSubs.some(
      (s) =>
        (s.status === "active" || s.status === "trialing") &&
        s.productKeys.includes(args.productKey),
    );
    if (hasExisting && user?.stripeCustomerId) {
      const stripe = getStripe();
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${SITE_URL}/account`,
      });
      return { url: portalSession.url };
    }

    const stripe = getStripe();
    const prices = await stripe.prices.list({
      lookup_keys: [args.productKey],
      active: true,
    });
    const price = prices.data[0];
    if (!price) throw new Error(`Unknown product: ${args.productKey}`);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user?.stripeCustomerId ?? undefined,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/pricing`,
      subscription_data: { metadata: { convexUserId: userId, productKey: price.lookup_key } },
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
      return_url: `${SITE_URL}/account`,
    });
    return { url: session.url };
  },
});
