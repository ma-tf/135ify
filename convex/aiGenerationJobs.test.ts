/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vite-plus/test";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest({ schema, modules });
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
