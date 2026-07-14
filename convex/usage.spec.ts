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

describe("insertRawUsage", () => {
  test("records a row in rawUsage table", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake"], { type: "image/png" }));
    });
    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(internal.usage.insertRawUsage, {
      jobId,
      model: "gpt-5.4",
      provider: "openai",
      inputTokens: 5000,
      outputTokens: 1000,
      costCents: 4,
      responseId: "resp_test",
      createdAt: Date.now(),
    });

    const rows = await authed.run(async (ctx) => {
      return await ctx.db.query("rawUsage").collect();
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].inputTokens).toBe(5000);
    expect(rows[0].outputTokens).toBe(1000);
    expect(rows[0].costCents).toBe(4);
    expect(rows[0].model).toBe("gpt-5.4");
    expect(rows[0].provider).toBe("openai");
    expect(rows[0].jobId).toBe(jobId);
    expect(rows[0].responseId).toBe("resp_test");
  });
});

describe("getMonthlyCost", () => {
  test("sums costCents across billing periods", async () => {
    const authed = await setup();

    const sourceStorageId = await authed.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake"], { type: "image/png" }));
    });
    const jobId = await authed.mutation(api.aiGenerationJobs.createJob, {
      sourceStorageId,
      fileName: "test.png",
      apiKey: "sk-test",
    });

    await authed.mutation(internal.usage.insertRawUsage, {
      jobId,
      model: "gpt-5.4",
      provider: "openai",
      inputTokens: 100,
      outputTokens: 50,
      costCents: 10,
      responseId: "resp_1",
      createdAt: Date.now(),
    });
    await authed.mutation(internal.usage.insertRawUsage, {
      jobId,
      model: "gpt-5.4",
      provider: "openai",
      inputTokens: 200,
      outputTokens: 100,
      costCents: 20,
      responseId: "resp_2",
      createdAt: Date.now(),
    });

    const total = await authed.query(internal.usage.getMonthlyCost, { sinceMs: -1 });
    expect(total).toBe(30);
  });

  test("returns 0 when no rows exist", async () => {
    const authed = await setup();
    const total = await authed.query(internal.usage.getMonthlyCost, { sinceMs: -1 });
    expect(total).toBe(0);
  });
});

describe("getAiUsage", () => {
  test("returns null for non-subscribers", async () => {
    const authed = await setup();
    const result = await authed.query(api.usage.getAiUsage, {});
    expect(result).toBeNull();
  });
});
