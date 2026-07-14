/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";

import { api } from "./_generated/api";
import schema from "./schema";

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

async function setup(tier?: string) {
  const t = convexTest({ schema, modules });
  const userId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: null });
    if (tier === "paid") {
      await ctx.db.insert("userEntitlements", {
        userId,
        lookupKeys: ["storage_paid"],
        updated: Date.now(),
      });
    }
    return userId;
  });
  return t.withIdentity({ subject: `${userId}|session` });
}

describe("getStorageUsage", () => {
  test("returns free tier limits for user with no entitlements", async () => {
    const authed = await setup();

    const result = await authed.query(api.images.getStorageUsage);

    expect(result.imageLimit).toBe(36);
    expect(result.storageLimitBytes).toBe(360 * 1024 * 1024);
    expect(result.tier).toBe("free");
  });

  test("returns paid tier limits for paid user", async () => {
    const authed = await setup("paid");

    const result = await authed.query(api.images.getStorageUsage);

    expect(result.imageLimit).toBe(360);
    expect(result.storageLimitBytes).toBe(9216 * 1024 * 1024);
    expect(result.tier).toBe("paid");
  });
});

describe("images.create", () => {
  test("rejects when image count exceeds free tier limit", async () => {
    const authed = await setup("free");

    const storageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
    });

    for (let i = 0; i < 36; i++) {
      await authed.mutation(api.images.create, {
        storageId,
        fileName: `img${i}.png`,
        source: "manual",
      });
    }

    await expect(
      authed.mutation(api.images.create, {
        storageId,
        fileName: "overflow.png",
        source: "manual",
      }),
    ).rejects.toThrow("Gallery image limit reached");
  });

  test("rejects file exceeding free tier file size limit", async () => {
    const authed = await setup("free");

    const oversizedId = await authed.run(async (ctx) => {
      const large = new Uint8Array(11 * 1024 * 1024);
      return await ctx.storage.store(new Blob([large], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.images.create, {
        storageId: oversizedId,
        fileName: "large.png",
        source: "manual",
      }),
    ).rejects.toThrow("File exceeds file size limit");
  });

  test("accepts images when storage is under the free tier limit", async () => {
    const authed = await setup("free");

    const storageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["small"], { type: "image/png" }));
    });

    for (let i = 0; i < 35; i++) {
      await authed.mutation(api.images.create, {
        storageId,
        fileName: `img${i}.png`,
        source: "manual",
      });
    }

    const result = await authed.query(api.images.getStorageUsage);
    expect(result.atLimit).toBe(false);
  });
});
