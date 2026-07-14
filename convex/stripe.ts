"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
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
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      lookup_keys: [args.productKey],
      active: true,
    });
    const price = prices.data[0];
    if (!price) throw new Error(`Unknown product: ${args.productKey}`);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
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

export const addToSubscription = action({
  args: { productKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.runQuery(internal.stripeSync.getUserStripeInfo, { userId });
    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer ID found for this user");
    }

    const stripe = getStripe();
    try {
      const prices = await stripe.prices.list({
        lookup_keys: [args.productKey],
        active: true,
      });
      const price = prices.data[0];
      if (!price) throw new Error(`Unknown product: ${args.productKey}`);
      const priceId = price.id;

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
        limit: 1,
      });
      const subscription = subscriptions.data[0];
      if (!subscription) {
        throw new Error("No active subscription found");
      }

      const existingItem = subscription.items.data.find((item) => item.price.id === priceId);
      if (existingItem) {
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${SITE_URL}/account`,
        });
        return { url: session.url };
      }

      const items: { id?: string; price?: string }[] = subscription.items.data.map((item) => ({
        id: item.id,
      }));
      items.push({ price: priceId });

      await stripe.subscriptions.update(subscription.id, {
        items,
        proration_behavior: "create_prorations",
      });

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${SITE_URL}/account`,
      });
      return { url: session.url };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) throw new Error(error.message);
      throw error;
    }
  },
});
