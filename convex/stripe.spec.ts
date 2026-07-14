/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";

import schema from "./schema";
import { handleSyncSubscription, handleSyncEntitlements } from "./stripeSync";

const modules = import.meta.glob("./**/*.ts");

beforeEach(() => {
  process.env.FREE_TIER_IMAGE_LIMIT = "36";
  process.env.FREE_TIER_FILE_SIZE_MB = "10";
  process.env.FREE_TIER_STORAGE_MB = "360";
  process.env.PAID_TIER_IMAGE_LIMIT = "360";
  process.env.PAID_TIER_FILE_SIZE_MB = "25";
  process.env.PAID_TIER_STORAGE_MB = "9216";
});

afterEach(() => {
  delete process.env.FREE_TIER_IMAGE_LIMIT;
  delete process.env.FREE_TIER_FILE_SIZE_MB;
  delete process.env.FREE_TIER_STORAGE_MB;
  delete process.env.PAID_TIER_IMAGE_LIMIT;
  delete process.env.PAID_TIER_FILE_SIZE_MB;
  delete process.env.PAID_TIER_STORAGE_MB;
});

function setup() {
  const t = convexTest({ schema, modules });
  return t;
}

describe("syncSubscription", () => {
  test("sets stripeCustomerId and subscriptionStatus on first webhook", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_test123", "active", { convexUserId: userId });
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.stripeCustomerId).toBe("cus_test123");
    expect(user!.subscriptionStatus).toBe("active");
  });

  test("finds user by existing stripeCustomerId on subsequent webhooks", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_existing",
      });
    });

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_existing", "past_due", {});
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.stripeCustomerId).toBe("cus_existing");
    expect(user!.subscriptionStatus).toBe("past_due");
  });

  test("clears subscriptionStatus on cancelled subscription", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_cancel",
        subscriptionStatus: "active",
      });
    });

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_cancel", "canceled", {});
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.stripeCustomerId).toBe("cus_cancel");
    expect(user!.subscriptionStatus).toBeUndefined();
  });

  test("unknown stripeCustomerId is a no-op", async () => {
    const t = setup();

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_unknown", "active", {});
    });
  });

  test("preserves trialing status as subscriptionStatus", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_trialing", "trialing", { convexUserId: userId });
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.subscriptionStatus).toBe("trialing");
  });

  test("clears subscriptionStatus on unpaid subscription", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_unpaid",
        subscriptionStatus: "active",
      });
    });

    await t.run(async (ctx) => {
      await handleSyncSubscription(ctx, "cus_unpaid", "unpaid", {});
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.subscriptionStatus).toBeUndefined();
  });
});

describe("syncEntitlements", () => {
  test("creates entitlement record with lookup keys", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_entitled",
      });
    });

    await t.run(async (ctx) => {
      await handleSyncEntitlements(ctx, "cus_entitled", ["storage_paid", "ai_generation_platform"]);
    });

    const entitlements = await t.run(async (ctx) => {
      return await ctx.db
        .query("userEntitlements")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
    });

    expect(entitlements?.lookupKeys).toEqual(["storage_paid", "ai_generation_platform"]);
  });

  test("updates existing entitlement record", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_update",
      });
    });

    await t.run(async (ctx) => {
      await handleSyncEntitlements(ctx, "cus_update", ["storage_paid"]);
    });

    await t.run(async (ctx) => {
      await handleSyncEntitlements(ctx, "cus_update", []);
    });

    const entitlements = await t.run(async (ctx) => {
      return await ctx.db
        .query("userEntitlements")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
    });

    expect(entitlements?.lookupKeys).toEqual([]);
  });

  test("unknown stripeCustomerId is a no-op", async () => {
    const t = setup();

    await t.run(async (ctx) => {
      await handleSyncEntitlements(ctx, "cus_nobody", ["storage_paid"]);
    });
  });
});
