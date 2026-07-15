/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

beforeEach(() => {
  process.env.FREE_TIER_IMAGE_LIMIT = "100";
  process.env.FREE_TIER_FILE_SIZE_MB = "12";
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
      await ctx.db.insert("subscriptions", {
        userId,
        stripeSubscriptionId: "sub_test",
        stripeCustomerId: "cus_test",
        status: "active",
        productKeys: ["storage_paid"],
      });
    }
    return userId;
  });
  return t.withIdentity({ subject: `${userId}|session` });
}

const DEFAULT_PARAMS = {
  selectedFilmId: "none",
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
};

describe("getStorageUsage", () => {
  test("returns free tier limits for user with no subscriptions", async () => {
    const authed = await setup();

    const result = await authed.query(api.images.getStorageUsage);

    expect(result.imageLimit).toBe(100);
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

describe("getById", () => {
  async function createTestImage(authed: Awaited<ReturnType<typeof setup>>, withStorage = true) {
    return authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      let sourceStorageId: string | undefined;
      if (withStorage) {
        sourceStorageId = await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
      }
      return await ctx.db.insert("images", {
        userId,
        fileName: "test.png",
        sourceStorageId: sourceStorageId as any,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
      });
    });
  }

  test("returns null when image not found", async () => {
    const authed = await setup();
    const imageId = await createTestImage(authed, true);

    const result = await authed.query(api.images.getById, { imageId });

    expect(result).not.toBeNull();
    expect(result!._id).toBe(imageId);
    expect(result!.sourceUrl).toBeTruthy();
    expect(result!.size).toBe(4);
  });

  test("returns null when image not found", async () => {
    const authed = await setup();
    const imageId = await createTestImage(authed, true);
    await authed.run(async (ctx) => {
      await ctx.db.delete("images", imageId);
    });

    const result = await authed.query(api.images.getById, { imageId });

    expect(result).toBeNull();
  });

  test("returns null when image belongs to a different user", async () => {
    const t = convexTest({ schema, modules });
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const authed1 = t.withIdentity({ subject: `${user1Id}|session` });
    const authed2 = t.withIdentity({ subject: `${user2Id}|session` });

    const imageId = await authed1.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
      return await ctx.db.insert("images", {
        userId: user1Id,
        fileName: "test.png",
        sourceStorageId: storageId,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
      });
    });

    const result = await authed2.query(api.images.getById, { imageId });
    expect(result).toBeNull();
  });

  test("returns null sourceUrl and size when image has no storage", async () => {
    const authed = await setup();
    const imageId = await createTestImage(authed, false);

    const result = await authed.query(api.images.getById, { imageId });

    expect(result).not.toBeNull();
    expect(result!.sourceUrl).toBeNull();
    expect(result!.size).toBeNull();
  });
});

describe("listByUser", () => {
  async function createImage(
    authed: Awaited<ReturnType<typeof setup>>,
    overrides?: { source?: "openai" | "manual"; withStorage?: boolean },
  ) {
    return authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      let sourceStorageId: string | undefined;
      if (overrides?.withStorage ?? true) {
        sourceStorageId = await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
      }
      return await ctx.db.insert("images", {
        userId,
        fileName: "test.png",
        sourceStorageId: sourceStorageId as any,
        params: DEFAULT_PARAMS,
        source: overrides?.source ?? "manual",
        status: "completed",
      });
    });
  }

  test("returns all user images ordered by _creationTime desc", async () => {
    const authed = await setup();
    const id1 = await createImage(authed);
    const id2 = await createImage(authed);

    const result = await authed.query(api.images.listByUser, {});

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe(id2);
    expect(result[1]._id).toBe(id1);
  });

  test("returns empty array for user with no images", async () => {
    const authed = await setup();

    const result = await authed.query(api.images.listByUser, {});

    expect(result).toEqual([]);
  });

  test("filters by source when arg is provided", async () => {
    const authed = await setup();
    await createImage(authed, { source: "openai" });
    await createImage(authed, { source: "manual" });

    const openaiResults = await authed.query(api.images.listByUser, { source: "openai" });
    const manualResults = await authed.query(api.images.listByUser, { source: "manual" });

    expect(openaiResults).toHaveLength(1);
    expect(openaiResults[0].source).toBe("openai");
    expect(manualResults).toHaveLength(1);
    expect(manualResults[0].source).toBe("manual");
  });

  test("includes sourceUrl and size for images with storage", async () => {
    const authed = await setup();
    await createImage(authed, { withStorage: true });

    const result = await authed.query(api.images.listByUser, {});

    expect(result).toHaveLength(1);
    expect(result[0].sourceUrl).toBeTruthy();
    expect(result[0].size).toBe(4);
  });

  test("returns null sourceUrl and size for images without storage", async () => {
    const authed = await setup();
    await createImage(authed, { withStorage: false });

    const result = await authed.query(api.images.listByUser, {});

    expect(result).toHaveLength(1);
    expect(result[0].sourceUrl).toBeNull();
    expect(result[0].size).toBeNull();
  });

  test("does not return images belonging to other users", async () => {
    const authed = await setup();

    const t2 = convexTest({ schema, modules });
    const otherUserId = await t2.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const otherAuthed = t2.withIdentity({ subject: `${otherUserId}|session` });

    await authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      return await ctx.db.insert("images", {
        userId: users[0]._id,
        fileName: "test.png",
        sourceStorageId: undefined,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
      });
    });

    const result = await otherAuthed.query(api.images.listByUser, {});
    expect(result).toEqual([]);
  });
});

describe("images.create", () => {
  test("rejects when image count exceeds free tier limit", async () => {
    const authed = await setup("free");

    const storageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
    });

    for (let i = 0; i < 100; i++) {
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
      const large = new Uint8Array(13 * 1024 * 1024);
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

  test("accepts images when count is under the free tier limit", async () => {
    const authed = await setup("free");

    const storageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["small"], { type: "image/png" }));
    });

    for (let i = 0; i < 99; i++) {
      await authed.mutation(api.images.create, {
        storageId,
        fileName: `img${i}.png`,
        source: "manual",
      });
    }

    const result = await authed.query(api.images.getStorageUsage);
    expect(result.atLimit).toBe(false);
  });

  test("rejects when total storage exceeds byte limit", async () => {
    const authed = await setup("free");

    const largeBlobId = await authed.run(async (ctx) => {
      const large = new Uint8Array(5 * 1024 * 1024);
      return await ctx.storage.store(new Blob([large]));
    });

    await authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      for (let i = 0; i < 99; i++) {
        await ctx.db.insert("images", {
          userId,
          fileName: `preloaded${i}.png`,
          sourceStorageId: largeBlobId,
          params: DEFAULT_PARAMS,
          source: "manual",
          status: "completed",
        });
      }
    });

    const newStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["new"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.images.create, {
        storageId: newStorageId,
        fileName: "overflow.png",
        source: "manual",
      }),
    ).rejects.toThrow("Gallery storage limit reached");
  });
});

describe("updateParams", () => {
  async function createImage(authed: Awaited<ReturnType<typeof setup>>) {
    return authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      return await ctx.db.insert("images", {
        userId,
        fileName: "test.png",
        sourceStorageId: undefined,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
      });
    });
  }

  test("updates params for owned image", async () => {
    const authed = await setup();
    const imageId = await createImage(authed);

    const result = await authed.mutation(api.images.updateParams, {
      imageId,
      params: {
        selectedFilmId: "portra",
        halationIntensity: 0.5,
        halationSpread: 0.2,
        halationThreshold: 0.1,
        vignetteIntensity: 0.3,
        vignetteFeather: 0.4,
        grainIntensity: 0.05,
      },
    });

    expect(result).toBeNull();
  });

  test("throws when image not found", async () => {
    const authed = await setup();
    const imageId = await createImage(authed);
    await authed.run(async (ctx) => {
      await ctx.db.delete("images", imageId);
    });

    await expect(
      authed.mutation(api.images.updateParams, {
        imageId,
        params: { halationIntensity: 0.5 },
      }),
    ).rejects.toThrow("Image not found");
  });

  test("throws unauthorized for another user's image", async () => {
    const t = convexTest({ schema, modules });
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const authed1 = t.withIdentity({ subject: `${user1Id}|session` });
    const authed2 = t.withIdentity({ subject: `${user2Id}|session` });

    const imageId = await authed1.run(async (ctx) => {
      return await ctx.db.insert("images", {
        userId: user1Id,
        fileName: "test.png",
        sourceStorageId: undefined,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
      });
    });

    await expect(
      authed2.mutation(api.images.updateParams, {
        imageId,
        params: { halationIntensity: 0.5 },
      }),
    ).rejects.toThrow("Unauthorized");
  });
});

describe("deleteImage", () => {
  async function createImage(authed: Awaited<ReturnType<typeof setup>>) {
    return authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      const storageId = await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
      return {
        imageId: await ctx.db.insert("images", {
          userId,
          fileName: "test.png",
          sourceStorageId: storageId,
          params: DEFAULT_PARAMS,
          source: "manual",
          status: "completed",
        }),
        storageId,
      };
    });
  }

  async function createChildImage(
    authed: Awaited<ReturnType<typeof setup>>,
    parentImageId: string,
  ) {
    return authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      return await ctx.db.insert("images", {
        userId,
        fileName: "child.png",
        sourceStorageId: undefined,
        params: DEFAULT_PARAMS,
        source: "manual",
        status: "completed",
        parent: { imageId: parentImageId as any, fileName: "test.png" },
      });
    });
  }

  test("deletes the image and its storage file", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);

    await authed.mutation(api.images.deleteImage, { imageId });

    const doc = await authed.run(async (ctx) => {
      return await ctx.db.get("images", imageId);
    });
    expect(doc).toBeNull();
  });

  test("throws when image not found", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);
    await authed.run(async (ctx) => {
      await ctx.db.delete("images", imageId);
    });

    await expect(authed.mutation(api.images.deleteImage, { imageId })).rejects.toThrow(
      "Image not found",
    );
  });

  test("throws unauthorized for another user's image", async () => {
    const t = convexTest({ schema, modules });
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    const authed1 = t.withIdentity({ subject: `${user1Id}|session` });
    const authed2 = t.withIdentity({ subject: `${user2Id}|session` });

    const { imageId } = await authed1.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["test"], { type: "image/png" }));
      return {
        imageId: await ctx.db.insert("images", {
          userId: user1Id,
          fileName: "test.png",
          sourceStorageId: storageId,
          params: DEFAULT_PARAMS,
          source: "manual",
          status: "completed",
        }),
      };
    });

    await expect(authed2.mutation(api.images.deleteImage, { imageId })).rejects.toThrow(
      "Unauthorized",
    );
  });

  test("clears parent.imageId on non-failed aiGenerationJobs", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);

    const jobId = await authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      const storageId = await ctx.storage.store(new Blob(["job"]));
      return await ctx.db.insert("aiGenerationJobs", {
        userId,
        status: "completed",
        sourceStorageId: storageId,
        fileName: "job.png",
        parent: { imageId, fileName: "test.png" },
      });
    });

    await authed.mutation(api.images.deleteImage, { imageId });

    const job = await authed.run(async (ctx) => {
      return await ctx.db.get("aiGenerationJobs", jobId);
    });
    expect(job).not.toBeNull();
    expect(job!.parent!.imageId).toBeUndefined();
    expect(job!.parent!.fileName).toBe("test.png");
  });

  test("deletes failed aiGenerationJobs referencing image as parent", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);

    const jobId = await authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      const storageId = await ctx.storage.store(new Blob(["job"]));
      const overQuotaStorageId = await ctx.storage.store(new Blob(["over"]));
      return await ctx.db.insert("aiGenerationJobs", {
        userId,
        status: "failed",
        sourceStorageId: storageId,
        fileName: "job.png",
        parent: { imageId, fileName: "test.png" },
        overQuotaStorageId,
      });
    });

    await authed.mutation(api.images.deleteImage, { imageId });

    const job = await authed.run(async (ctx) => {
      return await ctx.db.get("aiGenerationJobs", jobId);
    });
    expect(job).toBeNull();
  });

  test("unlinks orphaned child images", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);
    const childId = await createChildImage(authed, imageId);

    await authed.mutation(api.images.deleteImage, { imageId });

    const child = await authed.run(async (ctx) => {
      return await ctx.db.get("images", childId);
    });
    expect(child).not.toBeNull();
    expect(child!.parent!.imageId).toBeUndefined();
    expect(child!.parent!.fileName).toBe("test.png");
  });

  test("deletes aiGenerationJobs where takeImageId matches", async () => {
    const authed = await setup();
    const { imageId } = await createImage(authed);

    const jobId = await authed.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const userId = users[0]._id;
      const storageId = await ctx.storage.store(new Blob(["take"]));
      const overQuotaStorageId = await ctx.storage.store(new Blob(["over"]));
      return await ctx.db.insert("aiGenerationJobs", {
        userId,
        status: "completed",
        sourceStorageId: storageId,
        fileName: "take.png",
        takeImageId: imageId,
        overQuotaStorageId,
      });
    });

    await authed.mutation(api.images.deleteImage, { imageId });

    const job = await authed.run(async (ctx) => {
      return await ctx.db.get("aiGenerationJobs", jobId);
    });
    expect(job).toBeNull();
  });
});
