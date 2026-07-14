import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vite-plus/test";

import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest({ schema, modules });
  registerRateLimiter(t);
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: null,
    });
  });
  return t.withIdentity({ subject: `${userId}|session` });
}

describe("aiGenerationJobs usage tracking", () => {
  test("setJobStatus records usage on completed job", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "completed",
      usage: {
        inputTokens: 5000,
        outputTokens: 1000,
        costCents: 4,
        model: "gpt-5.4",
      },
    });

    const job = await authed.query(api.aiGenerationJobs.getJob, { jobId });
    expect(job).not.toBeNull();
    expect(job!.usage).toEqual({
      inputTokens: 5000,
      outputTokens: 1000,
      costCents: 4,
      model: "gpt-5.4",
    });
  });

  test("setJobStatus works without usage (failed job)", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "something went wrong",
    });

    const job = await authed.query(api.aiGenerationJobs.getJob, { jobId });
    expect(job).not.toBeNull();
    expect(job!.status).toBe("failed");
    expect(job!.failureReason).toBe("something went wrong");
    expect(job!.usage).toBeUndefined();
  });

  test("getJob returns usage when present", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "completed",
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        costCents: 1,
        model: "gpt-5.4",
      },
    });

    const job = await authed.query(api.aiGenerationJobs.getJob, { jobId });
    expect(job!.usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      costCents: 1,
      model: "gpt-5.4",
    });
  });
});

describe("aiGenerationJobs cost aggregation", () => {
  test("getMonthlyCost sums costCents in period", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const job1 = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "a.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId: job1,
      status: "completed",
      usage: { inputTokens: 100, outputTokens: 50, costCents: 10, model: "gpt-5.4" },
    });

    const job1Doc = await authed.query(api.aiGenerationJobs.getJob, { jobId: job1 });
    expect(job1Doc?.usage?.costCents).toBe(10);
    expect(typeof job1Doc?._creationTime).toBe("number");

    const job2 = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "b.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId: job2,
      status: "completed",
      usage: { inputTokens: 200, outputTokens: 100, costCents: 20, model: "gpt-5.4" },
    });

    const rawJobs = await authed.run(async (ctx) => {
      return await ctx.db.query("aiGenerationJobs").collect();
    });
    expect(rawJobs.length).toBeGreaterThanOrEqual(2);

    const total = await authed.query(internal.aiGenerationJobs.getMonthlyCost, { sinceMs: -1 });
    expect(total).toBe(30);
  });

  test("getMonthlyCost excludes jobs without usage", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "boom",
    });

    const total = await authed.query(internal.aiGenerationJobs.getMonthlyCost, { sinceMs: 0 });
    expect(total).toBe(0);
  });

  test("getMonthlyCost excludes jobs outside period", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });
    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "completed",
      usage: { inputTokens: 100, outputTokens: 50, costCents: 50, model: "gpt-5.4" },
    });

    const total = await authed.query(internal.aiGenerationJobs.getMonthlyCost, {
      sinceMs: Number.MAX_SAFE_INTEGER,
    });
    expect(total).toBe(0);
  });

  test("getAiUsage returns null for non-subscribers", async () => {
    const authed = await setup();
    const result = await authed.query(api.aiGenerationJobs.getAiUsage, {});
    expect(result).toBeNull();
  });
});

describe("aiGenerationJobs subscription gating", () => {
  async function setupWithSub(status = "active") {
    const t = convexTest({ schema, modules });
    registerRateLimiter(t);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptions", {
        userId,
        productKey: "ai_generation_platform",
        stripeSubscriptionId: `sub_${Math.random()}`,
        stripeCustomerId: `cus_${Math.random()}`,
        status,
      });
    });
    return t.withIdentity({ subject: `${userId}|session` });
  }

  test("createJob succeeds for subscribed user without apiKey", async () => {
    const authed = await setupWithSub();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
    });

    expect(jobId).toBeTruthy();
  });

  test("createJob succeeds for free user with apiKey", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    expect(jobId).toBeTruthy();
  });

  test("createJob throws for free user without apiKey", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
      }),
    ).rejects.toThrow("No API key available");
  });

  test("createJob throws for user with canceled subscription without apiKey", async () => {
    const authed = await setupWithSub("canceled");

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
      }),
    ).rejects.toThrow("No API key available");
  });

  test("retryJob succeeds for subscribed user without apiKey", async () => {
    const authed = await setupWithSub();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "test",
    });

    await authed.mutation(api.aiGenerationJobs.retryJob, { jobId });
    const job = await authed.query(api.aiGenerationJobs.getJob, { jobId });
    expect(job?.status).toBe("processing");
  });

  test("retryJob succeeds for free user with apiKey", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "test",
    });

    await authed.mutation(api.aiGenerationJobs.retryJob, {
      jobId,
      apiKey: "sk-test",
    });
    const job = await authed.query(api.aiGenerationJobs.getJob, { jobId });
    expect(job?.status).toBe("processing");
  });

  test("retryJob throws for free user without apiKey", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "test",
    });

    await expect(authed.mutation(api.aiGenerationJobs.retryJob, { jobId })).rejects.toThrow(
      "No API key available",
    );
  });
});

describe("aiGenerationJobs suspension gating", () => {
  async function setupSuspended(reason?: string) {
    const t = convexTest({ schema, modules });
    registerRateLimiter(t);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("aiGenerationSuspension", {
        userId,
        suspendedAt: Date.now(),
        ...(reason ? { reason } : {}),
      });
    });
    return t.withIdentity({ subject: `${userId}|session` });
  }

  test("createJob throws when user is suspended", async () => {
    const authed = await setupSuspended();
    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
        apiKey: "sk-test",
      }),
    ).rejects.toThrow("suspended");
  });

  test("createJob throws custom reason when provided", async () => {
    const authed = await setupSuspended("Abuse detected — contact support.");
    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
        apiKey: "sk-test",
      }),
    ).rejects.toThrow("Abuse detected — contact support.");
  });

  test("retryJob throws when user is suspended", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("aiGenerationSuspension", {
        userId,
        suspendedAt: Date.now(),
      });
    });
    const sourceStorageId = await t.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });
    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("aiGenerationJobs", {
        userId,
        status: "failed",
        sourceStorageId,
        fileName: "test.png",
        failureReason: "test",
      });
    });
    const authed = t.withIdentity({ subject: `${userId}|session` });

    await expect(authed.mutation(api.aiGenerationJobs.retryJob, { jobId })).rejects.toThrow(
      "suspended",
    );
  });
});

describe("aiGenerationJobs rate limiting", () => {
  test("createJob rate limits after exceeding per-user capacity", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "a.png",
      apiKey: "sk-test",
    });
    await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "b.png",
      apiKey: "sk-test",
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "c.png",
        apiKey: "sk-test",
      }),
    ).rejects.toThrow("RateLimited");
  });

  test("different users have independent rate limits", async () => {
    const sourceStorageId1 = await (async () => {
      const t = convexTest({ schema, modules });
      return await t.run(async (ctx) => {
        return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
      });
    })();

    const authed1 = await setup();
    await authed1.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId: sourceStorageId1,
      fileName: "a.png",
      apiKey: "sk-test",
    });
    await authed1.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId: sourceStorageId1,
      fileName: "b.png",
      apiKey: "sk-test",
    });

    const authed2 = await setup();
    const sourceStorageId2 = await authed2.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed2.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId: sourceStorageId2,
        fileName: "x.png",
        apiKey: "sk-test",
      }),
    ).resolves.toBeTruthy();
  });
});

describe("aiGenerationJobs suspend/unsuspend admin mutations", () => {
  async function setupWithUser() {
    const t = convexTest({ schema, modules });
    registerRateLimiter(t);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { email: null });
    });
    return {
      t,
      userId,
      authed: t.withIdentity({ subject: `${userId}|session` }),
    };
  }

  test("suspendUser creates a suspension record that blocks generation", async () => {
    const { authed, userId } = await setupWithUser();

    await authed.mutation(internal.aiGenerationJobs.suspendUser, {
      userId,
      reason: "Test suspension",
    });

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
        apiKey: "sk-test",
      }),
    ).rejects.toThrow("Test suspension");
  });

  test("suspendUser is idempotent when already suspended", async () => {
    const { t, authed, userId } = await setupWithUser();

    await authed.mutation(internal.aiGenerationJobs.suspendUser, {
      userId,
      reason: "First",
    });

    await authed.mutation(internal.aiGenerationJobs.suspendUser, {
      userId,
      reason: "Second",
    });

    const records = await t.run(async (ctx) => {
      return await ctx.db
        .query("aiGenerationSuspension")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
    });
    expect(records).toHaveLength(1);
  });

  test("unsuspendUser restores generation access", async () => {
    const { authed, userId } = await setupWithUser();

    await authed.mutation(internal.aiGenerationJobs.suspendUser, { userId });
    await authed.mutation(internal.aiGenerationJobs.unsuspendUser, { userId });

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    await expect(
      authed.mutation(api.aiGenerationJobs.createJob, {
        sourceStorageId,
        fileName: "test.png",
        apiKey: "sk-test",
      }),
    ).resolves.toBeTruthy();
  });

  test("unsuspendUser is a no-op when not suspended", async () => {
    const { authed, userId } = await setupWithUser();

    await authed.mutation(internal.aiGenerationJobs.unsuspendUser, { userId });
  });
});
