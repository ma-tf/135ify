/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vite-plus/test";

import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest({ schema, modules });
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { email: null });
  });
  return { t: t.withIdentity({ subject: `${userId}|session` }), userId };
}

describe("byUser", () => {
  test("returns subscriptions for the authenticated user", async () => {
    const { t: authed, userId } = await setup();

    await authed.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        userId,
        productKey: "ai_generation_platform",
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_test",
        status: "active",
      });
    });

    const subs = await authed.query(api.subscriptions.byUser);
    expect(subs).toHaveLength(1);
    expect(subs[0].stripeSubscriptionId).toBe("sub_1");
  });

  test("returns empty array when user has no subscriptions", async () => {
    const { t: authed } = await setup();

    const subs = await authed.query(api.subscriptions.byUser);
    expect(subs).toHaveLength(0);
  });
});

describe("upsert", () => {
  test("creates a new subscription with explicit userId", async () => {
    const { t: authed, userId } = await setup();

    await authed.mutation(internal.subscriptions.upsert, {
      userId,
      productKey: "ai_generation_platform",
      stripeSubscriptionId: "sub_new",
      stripeCustomerId: "cus_new",
      status: "active",
    });

    const subs = await authed.run(async (ctx) => {
      return await ctx.db.query("subscriptions").collect();
    });
    expect(subs).toHaveLength(1);
    expect(subs[0].stripeSubscriptionId).toBe("sub_new");
  });

  test("updates an existing subscription", async () => {
    const { t: authed, userId } = await setup();

    await authed.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        userId,
        productKey: "ai_generation_platform",
        stripeSubscriptionId: "sub_existing",
        stripeCustomerId: "cus_existing",
        status: "active",
      });
    });

    await authed.mutation(internal.subscriptions.upsert, {
      userId,
      productKey: "ai_generation_platform",
      stripeSubscriptionId: "sub_existing",
      stripeCustomerId: "cus_existing",
      status: "past_due",
      currentPeriodEnd: 2000,
      cancelAtPeriodEnd: true,
    });

    const subs = await authed.run(async (ctx) => {
      return await ctx.db.query("subscriptions").collect();
    });
    expect(subs).toHaveLength(1);
    expect(subs[0].status).toBe("past_due");
    expect(subs[0].currentPeriodEnd).toBe(2000);
    expect(subs[0].cancelAtPeriodEnd).toBe(true);
  });

  test("finds user by stripeCustomerId when userId is not provided", async () => {
    const { t: authed, userId } = await setup();

    await authed.run(async (ctx) => {
      await ctx.db.patch(userId, { stripeCustomerId: "cus_lookup" });
    });

    await authed.mutation(internal.subscriptions.upsert, {
      productKey: "ai_generation_platform",
      stripeSubscriptionId: "sub_lookup",
      stripeCustomerId: "cus_lookup",
      status: "active",
    });

    const subs = await authed.run(async (ctx) => {
      return await ctx.db.query("subscriptions").collect();
    });
    expect(subs).toHaveLength(1);
    expect(subs[0].stripeSubscriptionId).toBe("sub_lookup");
  });

  test("returns early when no user matches stripeCustomerId", async () => {
    const { t: authed } = await setup();

    await authed.mutation(internal.subscriptions.upsert, {
      productKey: "ai_generation_platform",
      stripeSubscriptionId: "sub_no_user",
      stripeCustomerId: "cus_nobody",
      status: "active",
    });

    const subs = await authed.run(async (ctx) => {
      return await ctx.db.query("subscriptions").collect();
    });
    expect(subs).toHaveLength(0);
  });
});

describe("remove", () => {
  test("deletes an existing subscription", async () => {
    const { t: authed, userId } = await setup();

    await authed.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        userId,
        productKey: "ai_generation_platform",
        stripeSubscriptionId: "sub_delete",
        stripeCustomerId: "cus_delete",
        status: "active",
      });
    });

    await authed.mutation(internal.subscriptions.remove, {
      stripeSubscriptionId: "sub_delete",
    });

    const subs = await authed.run(async (ctx) => {
      return await ctx.db.query("subscriptions").collect();
    });
    expect(subs).toHaveLength(0);
  });

  test("no-ops when subscription does not exist", async () => {
    const { t: authed } = await setup();

    await authed.mutation(internal.subscriptions.remove, {
      stripeSubscriptionId: "sub_nonexistent",
    });
  });
});
