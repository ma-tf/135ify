import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";

export const saveRawEvent = internalMutation({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("stripeEvents", {
      body: args.body,
      signature: args.signature,
      status: "pending",
      retries: 0,
      maxRetries: 5,
      backoffMs: 1000,
    });
    await ctx.scheduler.runAfter(0, internal.stripeProcessor.processEvent, {
      eventId,
    });
  },
});

export const getRawEvent = internalQuery({
  args: { eventId: v.id("stripeEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const markEventProcessed = internalMutation({
  args: {
    eventId: v.id("stripeEvents"),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: "processed",
      eventType: args.eventType,
      processedAt: Date.now(),
    });
  },
});

export const markEventFailed = internalMutation({
  args: {
    eventId: v.id("stripeEvents"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: "failed",
      error: args.error,
      processedAt: Date.now(),
    });
  },
});

export const retryEvent = internalMutation({
  args: {
    eventId: v.id("stripeEvents"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.status !== "pending") return;

    if (event.retries >= event.maxRetries) {
      await ctx.db.patch(args.eventId, {
        status: "failed",
        error: args.error,
        processedAt: Date.now(),
      });
      return;
    }

    const nextBackoff = event.backoffMs;
    await ctx.db.patch(args.eventId, {
      retries: event.retries + 1,
      backoffMs: nextBackoff * 2,
      error: args.error,
    });
    await ctx.scheduler.runAfter(nextBackoff, internal.stripeProcessor.processEvent, {
      eventId: args.eventId,
    });
  },
});
