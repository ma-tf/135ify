"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import type { ActionCtx } from "./_generated/server";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "./config";

export const processEvent = internalAction({
  args: { eventId: v.id("stripeEvents") },
  handler: async (ctx, args) => {
    const raw = await ctx.runQuery(internal.stripeWebhooks.getRawEvent, {
      eventId: args.eventId,
    });
    if (!raw || raw.status !== "pending") return;

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(raw.body, raw.signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      await ctx.runMutation(internal.stripeWebhooks.markEventFailed, {
        eventId: args.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
          await handleSubscriptionCreated(event, ctx);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event, ctx);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event, ctx);
          break;
        case "entitlements.active_entitlement_summary.updated":
          await handleEntitlementEvent(event, ctx);
          break;
      }

      await ctx.runMutation(internal.stripeWebhooks.markEventProcessed, {
        eventId: args.eventId,
        eventType: event.type,
      });
    } catch (error) {
      await ctx.runMutation(internal.stripeWebhooks.retryEvent, {
        eventId: args.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});

function getProductKeys(sub: Stripe.Subscription): string[] {
  return sub.items.data.map((item) => item.price.lookup_key).filter((k): k is string => !!k);
}

async function handleSubscriptionCreated(event: Stripe.Event, ctx: ActionCtx) {
  const sub = event.data.object as Stripe.Subscription;
  await ctx.runMutation(internal.stripeSync.syncSubscription, {
    stripeCustomerId: sub.customer as string,
    status: sub.status,
    metadata: sub.metadata,
  });

  await ctx.runMutation(internal.subscriptions.upsert, {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    status: sub.status,
    currentPeriodEnd: sub.items.data[0]?.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    productKeys: getProductKeys(sub),
  });
}

async function handleSubscriptionUpdated(event: Stripe.Event, ctx: ActionCtx) {
  const sub = event.data.object as Stripe.Subscription;
  await ctx.runMutation(internal.stripeSync.syncSubscription, {
    stripeCustomerId: sub.customer as string,
    status: sub.status,
    metadata: sub.metadata,
  });

  await ctx.runMutation(internal.subscriptions.upsert, {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    status: sub.status,
    currentPeriodEnd: sub.items.data[0]?.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    productKeys: getProductKeys(sub),
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event, ctx: ActionCtx) {
  const sub = event.data.object as Stripe.Subscription;
  await ctx.runMutation(internal.stripeSync.syncSubscription, {
    stripeCustomerId: sub.customer as string,
    status: sub.status,
    metadata: sub.metadata,
  });

  await ctx.runMutation(internal.subscriptions.remove, {
    stripeSubscriptionId: sub.id,
  });
}

async function handleEntitlementEvent(event: Stripe.Event, ctx: ActionCtx) {
  const summary = event.data.object as Stripe.Entitlements.ActiveEntitlementSummary;
  const stripeCustomerId = summary.customer;
  const lookupKeys = summary.entitlements.data.map(
    (e: Stripe.Entitlements.ActiveEntitlement) => e.lookup_key,
  );

  await ctx.runMutation(internal.stripeSync.syncEntitlements, { stripeCustomerId, lookupKeys });
}
