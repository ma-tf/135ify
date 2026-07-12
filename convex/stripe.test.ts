/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";

import schema from "./schema";
import { handleSyncSubscription, handleProvisionAccess, handleRevokeAccess } from "./stripeSync";

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
});

describe("provisionAccess", () => {
  test("sets storageTier to paid", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_provision",
      });
    });

    await t.run(async (ctx) => {
      await handleProvisionAccess(ctx, "cus_provision");
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.storageTier).toBe("paid");
  });

  test("is idempotent", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_idempotent",
        storageTier: "paid",
      });
    });

    await t.run(async (ctx) => {
      await handleProvisionAccess(ctx, "cus_idempotent");
      await handleProvisionAccess(ctx, "cus_idempotent");
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.storageTier).toBe("paid");
  });

  test("unknown stripeCustomerId is a no-op", async () => {
    const t = setup();

    await t.run(async (ctx) => {
      await handleProvisionAccess(ctx, "cus_nobody");
    });
  });
});

describe("revokeAccess", () => {
  test("sets storageTier to free", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_revoke",
        storageTier: "paid",
      });
    });

    await t.run(async (ctx) => {
      await handleRevokeAccess(ctx, "cus_revoke");
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.storageTier).toBe("free");
  });

  test("is idempotent", async () => {
    const t = setup();

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: null,
        stripeCustomerId: "cus_revoke_idem",
        storageTier: "free",
      });
    });

    await t.run(async (ctx) => {
      await handleRevokeAccess(ctx, "cus_revoke_idem");
      await handleRevokeAccess(ctx, "cus_revoke_idem");
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user!.storageTier).toBe("free");
  });

  test("unknown stripeCustomerId is a no-op", async () => {
    const t = setup();

    await t.run(async (ctx) => {
      await handleRevokeAccess(ctx, "cus_nobody");
    });
  });
});
