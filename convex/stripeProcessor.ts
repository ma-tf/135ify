"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const processEvent = internalAction({
  args: { eventId: v.id("stripeEvents") },
  handler: async (ctx, args) => {
    const raw = await ctx.runQuery(internal.stripeWebhooks.getRawEvent, {
      eventId: args.eventId,
    });
    if (!raw || raw.status !== "pending") return;

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(
        raw.body,
        raw.signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
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
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await ctx.runMutation(internal.stripeSync.syncSubscription, {
            stripeCustomerId: sub.customer as string,
            status: sub.status,
            metadata: sub.metadata,
          });
          break;
        }

        case "entitlements.active_entitlement_summary.updated": {
          const summary = event.data.object as Stripe.Entitlements.ActiveEntitlementSummary;
          const stripeCustomerId = summary.customer;
          const lookupKeys = summary.entitlements.data.map(
            (e: Stripe.Entitlements.ActiveEntitlement) => e.lookup_key,
          );

          if (lookupKeys.includes("gallery-storage-paid")) {
            await ctx.runMutation(internal.stripeSync.provisionAccess, { stripeCustomerId });
          } else {
            await ctx.runMutation(internal.stripeSync.revokeAccess, { stripeCustomerId });
          }
          break;
        }
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
