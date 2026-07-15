import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { OPENAI_MONTHLY_SPEND_LIMIT_CENTS } from "./config";
import { requireAuth } from "./lib";

function getBillingPeriod(at: number): string {
  const now = new Date(at);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth());
  return startOfMonth.toISOString().split("T")[0];
}

function getBillingPeriodsBetween(fromMs: number, toMs: number): string[] {
  const periods: string[] = [];
  const d = new Date(fromMs);
  const end = new Date(toMs);
  while (d <= end) {
    periods.push(getBillingPeriod(d.getTime()));
    d.setMonth(d.getMonth() + 1);
  }
  return periods;
}

export const insertRawUsage = internalMutation({
  args: {
    jobId: v.id("aiGenerationJobs"),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costCents: v.number(),
    responseId: v.string(),
    createdAt: v.number(),
    rawResponse: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await ctx.db.insert("rawUsage", {
      ...args,
      userId,
      billingPeriod: getBillingPeriod(Date.now()),
    });
  },
});

export const getMonthlyCost = internalQuery({
  args: { sinceMs: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const periods = getBillingPeriodsBetween(args.sinceMs, Date.now());
    let total = 0;
    for (const period of periods) {
      const rows = await ctx.db
        .query("rawUsage")
        .withIndex("by_billingPeriod_userId", (q) =>
          q.eq("billingPeriod", period).eq("userId", userId),
        )
        .collect();
      total += rows.reduce((sum, r) => sum + r.costCents, 0);
    }
    return total;
  },
});

export const getAiUsage = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    usedCents: number;
    limitCents: number;
    atLimit: boolean;
    resetsAt: number;
  } | null> => {
    const userId = await requireAuth(ctx);
    const hasAiGeneration = await ctx.runQuery(internal.subscriptions.hasProductKey, {
      productKey: "ai_generation_platform",
    });
    if (!hasAiGeneration) return null;

    const now = Date.now();
    const date = new Date(now);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    const periodStart = periodEnd - 30 * 24 * 60 * 60 * 1000;

    const periods = getBillingPeriodsBetween(periodStart, periodEnd);
    let usedCents = 0;
    for (const period of periods) {
      const rows = await ctx.db
        .query("rawUsage")
        .withIndex("by_billingPeriod_userId", (q) =>
          q.eq("billingPeriod", period).eq("userId", userId),
        )
        .collect();
      usedCents += rows.reduce((sum, r) => sum + r.costCents, 0);
    }
    const limitCents = OPENAI_MONTHLY_SPEND_LIMIT_CENTS;

    return {
      usedCents,
      limitCents,
      atLimit: usedCents >= limitCents,
      resetsAt: periodEnd,
    };
  },
});
