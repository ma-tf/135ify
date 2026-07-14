# Platform AI key management research

Research on how 135ify should manage a shared OpenAI API key for subscriber AI generation. All information sourced from
official `platform.openai.com/docs` and `docs.convex.dev`.

## Sources consulted

- [OpenAI Production Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI API Key Safety Best Practices](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI RBAC / Permissions](https://platform.openai.com/docs/guides/rbac)
- [OpenAI Admin APIs](https://platform.openai.com/docs/guides/admin-apis)
- [OpenAI API Authentication Reference](https://platform.openai.com/docs/api-reference/authentication)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
- [Convex Actions](https://docs.convex.dev/functions/actions)
- Existing codebase: `convex/aiGenerationJobsActions.ts`, `convex/convex.config.ts`, `src/stores/ai-provider-store.ts`

---

## 1. OpenAI API key best practices

### Key types

OpenAI has three key tiers:

| Key type                | Scope                        | Use case                                                                             |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| **Project API key**     | Single project within an org | Standard API access for an application                                               |
| **Admin API key**       | Entire organization          | Programmatic management of org resources (users, projects, spend alerts, audit logs) |
| **Service account key** | Single project               | Non-human API access with restricted permissions                                     |

For 135ify's platform key, a **Project API key** scoped to a specific project (e.g., a `135ify-prod` project) is the
right type. Admin keys have overly broad permissions and should not be used for API calls.

### Key safety (from OpenAI's published best practices)

1. **Never expose keys client-side.** Keys sent to browsers/mobile apps can be stolen and abused. Always route through a
   backend server. This is exactly the issue the platform key migration solves — moving from client-side BYO-KEY to
   server-side key.

2. **Use unique keys per team member.** Do not share a single key across developers. Each team member gets their own key
   via the org Members page.

3. **Store keys in environment variables.** Never commit keys to source control. Use `process.env.OPENAI_API_KEY` or a
   secrets manager.

4. **Use per-key permissions (scoped keys).** API keys can be restricted to specific permissions (e.g., Model
   Capabilities Request only, no Files/Admin access). For the platform key, scope to:
   - `Model Capabilities: Request` (required for image generation via the Responses API)
   - Nothing else — no Files, no Admin, no Billing

5. **Restrict by IP allowlisting.** Configure which IP addresses can use the key. Since Convex actions run from known IP
   ranges, the platform key should be IP-whitelisted to Convex's outbound IPs.

6. **Enable usage tracking.** Keys generated after Dec 20, 2023 have usage tracking enabled by default. Each API key's
   usage appears in the dashboard under the Usage page.

### Key rotation

- Rotate keys via the [API Keys page](https://platform.openai.com/settings/organization/api-keys)
- On rotation: create a new key, update the Convex environment variable, verify, then revoke the old key
- Convex deploys are atomic and fast, so a key rotation can be done with near-zero downtime: update the env var,
  redeploy
- No API exists for programmatic key rotation — this is a manual dashboard operation

---

## 2. Per-user usage and cost tracking

### Where OpenAI tracks usage

OpenAI provides two levels of usage tracking:

1. **Dashboard usage page:** Shows token consumption and cost per project, per model, per API key. Accessible at
   `platform.openai.com/usage`.

2. **Admin Usage API:** Programmatic access to usage data via the Admin API. The `costs` endpoint returns costs per
   category, and there are per-model usage endpoints (completions, embeddings, images, etc.).

### Tracking per-user cost in 135ify

OpenAI does **not** track usage per end-user of your application — it tracks usage per API key and per organization. To
track per-user cost, 135ify must implement its own tracking layer:

**Option A — Log token counts from API responses (recommended)**

Every `openai.responses.create` call returns `usage` with `input_tokens`, `output_tokens`, and `output_tokens_details`.
Store these in the `aiGenerationJobs` table:

```typescript
// Pseudocode for aiGenerationJobsActions.ts
const genResponse = await openai.responses.create({ ... });

await ctx.runMutation(internal.aiGenerationJobs.recordUsage, {
  jobId: args.jobId,
  usage: {
    inputTokens: genResponse.usage.input_tokens,
    outputTokens: genResponse.usage.output_tokens,
    model: genResponse.model,
  },
});
```

This gives per-generation cost data. Multiply tokens by the model's per-token price to calculate cost.

**Option B — Track generation count only**

Simpler but less precise. Count successful AI Takes per user per billing period. Store a counter on the user document or
in a separate `aiGenerationUsage` table.

**Option C — Poll Admin Usage API**

Periodically query OpenAI's Admin Usage API to get total cost, then approximate per-user cost. This is coarse and
impractical for real-time enforcement.

### Schema additions needed

To support per-user tracking, add to the `aiGenerationJobs` table:

```typescript
usage: v.optional(
  v.object({
    inputTokens: v.number(),
    outputTokens: v.number(),
    costCents: v.number(), // calculated at generation time
    model: v.string(),
  }),
);
```

And possibly a `userGenerationCount` field on the `users` table for a running tally, or a separate `aiGenerationUsage`
table for historical records.

### Model pricing reference

GPT-5.4 image generation pricing (via Responses API) can be found at `openai.com/api/pricing/`. Costs are per image
generated, not per token. The exact cost per image depends on the model version and image resolution. Plan to store the
known cost per generation as a config constant.

---

## 3. Rate limiting approaches

### OpenAI's built-in rate limits

OpenAI applies rate limits at the **organization** and **project** level, not per end-user:

| Metric | Description                                       |
| ------ | ------------------------------------------------- |
| RPM    | Requests per minute                               |
| RPD    | Requests per day                                  |
| TPM    | Tokens per minute                                 |
| TPD    | Tokens per day                                    |
| IPM    | Images per minute (relevant for image generation) |

Rate limits vary by model and usage tier:

| Tier   | Qualification         | Monthly usage limit |
| ------ | --------------------- | ------------------- |
| Free   | Any allowed geography | $100                |
| Tier 1 | $5 paid               | $100                |
| Tier 2 | $50 paid              | $500                |
| Tier 3 | $100 paid             | $1,000              |
| Tier 4 | $250 paid             | $5,000              |
| Tier 5 | $1,000 paid           | $200,000            |

Rate limit headers are returned on every response: `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`,
`x-ratelimit-reset-requests`, and equivalent token-level headers.

### Application-level rate limiting (what 135ify must build)

OpenAI's rate limits protect the API key, but don't enforce per-user fairness. 135ify must add its own layer:

**Per-user rate limiting**

Store a counter on the user document or in a `rateLimit` table. Before calling the OpenAI action, check:

```typescript
// Pseudocode: convex/aiGeneration.ts
const RATE_LIMIT = { maxPerHour: 10, maxPerDay: 50 };

const recentCount = await ctx.db
  .query("aiGenerationJobs")
  .withIndex("by_userId", (q) => q.eq("userId", user._id).gte("_creationTime", hourAgo))
  .count();

if (recentCount >= RATE_LIMIT.maxPerHour) {
  throw new Error("Rate limit exceeded. Please wait.");
}
```

**Global rate limiting**

Also enforce a global limit to ensure one user doesn't consume the platform's entire OpenAI TPM budget:

- Track active/pending jobs in a `globalGenerationCounter` singleton document
- At generation start, atomically increment it via a mutation
- If the counter exceeds a threshold, reject new jobs
- Decrement on completion/failure

**Retry with exponential backoff**

When OpenAI returns a 429 (rate limit), retry with exponential backoff. The OpenAI SDK does this automatically in newer
versions, or can be configured:

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, // built-in retry with backoff
});
```

### Work queues

For fairness in a multi-user system, consider queuing generation requests rather than processing them immediately.
Convex's [Workpool Component](https://www.convex.dev/components/workpool) is purpose-built for this — it organizes async
operations into queues with configurable parallelism and retries.

---

## 4. Abuse prevention

### Detection strategies

1. **Monitor generation frequency per user.** Alert on anomalous patterns (e.g., a user who normally generates 2/day
   suddenly generates 50/hour).

2. **Count failures vs successes.** A user generating many failures may be attempting to probe the system or running
   automated scripts.

3. **Track total cost per user per billing period.** Flag users approaching or exceeding expected subscription-attached
   limits.

4. **Log every generation attempt** — not just completed ones. The `aiGenerationJobs` table already tracks failed and
   `overQuota` jobs. Ensure every attempt (including pre-flight rejections) is logged.

### Prevention mechanisms

1. **Subscription entitlement gating.** The primary prevention: only users with an active `ai-generation-platform-key`
   subscription can trigger server-side generation. The Convex action checks the user's entitlements before calling
   OpenAI.

2. **Per-user rate caps.** As described in section 3. Hard caps enforced by the Convex mutation that schedules the
   generation action.

3. **Per-user cost caps.** If a user exceeds a set dollar amount in a billing period, block further generation until the
   next period. This can be per-subscription-tier (e.g., "AI Basic" includes up to $5/month of API cost, "AI Pro"
   includes up to $25/month).

4. **Convex action timeout protection.** Actions time out after 10 minutes. If a user submits many concurrent requests,
   some will time out naturally. The `aiGenerationJobs` `status: "processing"` guard prevents double-submission for the
   same Source Image (the existing code already checks for existing processing jobs).

5. **IP allowlisting on the OpenAI key.** Restrict the key to Convex's known outbound IP ranges. Even if the key leaks
   (unlikely, since it lives only in Convex env vars), it can't be used from arbitrary IPs.

### Response to detected abuse

- Automatically suspend the user's AI generation access (via an `aiGenerationSuspended` boolean on the user document)
- Log to an audit table
- Notify the admin (email/webhook)
- Require manual review to lift suspension

---

## 5. Cost monitoring and alerting

### OpenAI-side monitoring

OpenAI provides several cost monitoring tools:

**Spend alerts (Admin API / Dashboard)**

Create programmatic spend alerts per project via the Admin API. Alerts send email notifications to configured recipients
when spend crosses a threshold:

```typescript
await client.admin.organization.projects.spendAlerts.create("proj_abc", {
  currency: "USD",
  interval: "month",
  notification_channel: {
    recipients: ["billing@135ify.com"],
    type: "email",
    subject_prefix: "[OpenAI spend]",
  },
  threshold_amount: 10000, // cents = $100
});
```

These can also be set manually in the [Dashboard limits page](https://platform.openai.com/settings/organization/limits).

**Dashboard monitoring**

- Real-time usage dashboard at `platform.openai.com/usage`
- Per-project, per-model, per-API-key breakdowns
- Current and past billing cycle views

**Note on spend alerts:** OpenAI's spend alerts work at the organization/project level, not per-user. They alert on
total platform spend, not individual user spend.

### Application-side monitoring (what 135ify must build)

Since OpenAI can't alert on per-user cost, 135ify needs its own monitoring:

1. **Per-user cost aggregation.** Calculate from stored `usage` data (see section 2). Sum costs per user per period.

2. **Budget alert system.** If a user's cost exceeds their subscription tier's included allowance, trigger:
   - A toast notification in the UI (already established pattern for quota warnings)
   - Optionally, an email via a scheduled Convex function
   - An admin dashboard view showing top spenders

3. **Anomaly detection.** If a single generation costs significantly more than the known baseline (e.g., due to a model
   change or prompt regression), flag it.

4. **Admin cost dashboard.** A Convex query that surfaces:
   - Total platform OpenAI spend this month
   - Top N users by cost
   - Cost per subscription tier
   - Anomalous users (cost spike detection)

5. **Global spend cap.** A Convex env var `OPENAI_MONTHLY_SPEND_LIMIT_CENTS` that, when reached, blocks all generation
   until the next billing period. This is the ultimate kill switch.

---

## 6. Key rotation and security

### Rotation procedure

1. Create new key in [OpenAI Dashboard](https://platform.openai.com/settings/organization/api-keys)
2. Set the new key as a Convex environment variable: `npx convex env set OPENAI_API_KEY 'sk-...'`
3. Deploy the change (Convex env var changes take effect immediately)
4. Verify a test generation succeeds
5. Revoke the old key in the OpenAI Dashboard

### Security checklist for the platform key

| Measure                                                | Status                          |
| ------------------------------------------------------ | ------------------------------- |
| Store in Convex environment variable (never in code)   | Required                        |
| Scope to `Model Capabilities: Request` permission only | Recommended                     |
| IP allowlist to Convex outbound IPs                    | Recommended                     |
| No other code path uses the key                        | Required                        |
| Separate keys for dev and prod deployments             | Recommended                     |
| Usage tracking enabled on key                          | Required (default for new keys) |
| Audit log review (Admin API)                           | Periodic                        |

### Key lifecycle

- **Creation:** Dashboard only (no API for creating project keys)
- **Rotation:** Scheduled every 90 days, or immediately on suspicion of compromise
- **Revocation:** Immediate via Dashboard
- **Audit:** Review `admin.organization.auditLogs.list()` for key-related events

---

## 7. Convex integration points

### Where the key lives

The platform key lives as a **Convex environment variable** named `OPENAI_API_KEY`.

**Declaration in `convex/convex.config.ts`:**

```typescript
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    // existing
    GALLERY_IMAGE_LIMIT: v.optional(v.string()),
    FILE_SIZE_LIMIT_BYTES: v.optional(v.string()),
    GALLERY_STORAGE_LIMIT_BYTES: v.optional(v.string()),
    // new
    OPENAI_API_KEY: v.string(),
  },
});

export default app;
```

**Setting values:**

```bash
npx convex env set OPENAI_API_KEY 'sk-proj-...'    # prod
npx convex env set OPENAI_API_KEY 'sk-test-...'     # dev (test mode key)
```

**Consuming in the action:**

```typescript
// convex/aiGenerationJobsActions.ts
import { env } from "./_generated/server";

export const processJob = action({
  args: {
    jobId: v.id("aiGenerationJobs"),
    // apiKey removed from args — no longer passed from client
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    // ...
  },
});
```

Key differences from current client-supplied key flow:

- `apiKey` is no longer an argument to the action
- No key is sent over the wire from the client
- The key is never exposed to the client at all

### How actions authenticate

Convex actions authenticate users via `ctx.auth`. The action can call `ctx.auth.getUserIdentity()` to get the
authenticated user, then verify their subscription status:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");

const user = await ctx.runQuery(internal.users.getByTokenIdentifier, {
  tokenIdentifier: identity.tokenIdentifier,
});

// Check subscription entitlement
const hasAiAccess = await ctx.runQuery(internal.subscriptions.hasAiGeneration, {
  userId: user._id,
});
if (!hasAiAccess) throw new Error("No active AI generation subscription");
```

This is already partially implemented — the existing `aiGenerationJobs` mutations use `requireAuth(ctx)` via `lib.ts`.

### Env var per deployment

Convex env vars are set per deployment. This means:

- **Dev deployment:** use an OpenAI test-mode key with low spend limits
- **Prod deployment:** use the real platform key with appropriate spend limits
- Both keys should be scoped to separate OpenAI projects for clean usage tracking

### Key never hits the client

The mutation pattern (client calls mutation, mutation schedules action) ensures the key stays server-side:

```
Client                   Convex mutation              Convex action
  |                            |                            |
  |-- scheduleGeneration() --> |                            |
  |                            |-- insert job (processing)   |
  |                            |-- scheduler.runAfter(0) --> |
  |                            |                            |-- read env.OPENAI_API_KEY
  |                            |                            |-- call OpenAI API
  |                            |                            |-- store result
  |                            |  <-- setJobStatus --------- |
  |  <-- toast/notification -- |                            |
```

The existing code at `src/hooks/useAiGrainGeneration.ts` already follows this pattern (calls `createJob` mutation, then
calls `processJob` action). The change is purely in the action: instead of receiving `apiKey` from the client via args,
read it from `env`.

### Reusing existing infrastructure

The following existing code paths remain unchanged or need minimal modification:

| Component                         | Change                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `aiGenerationJobs` table          | Adds `usage` field for cost tracking                        |
| `aiGenerationJobsActions.ts`      | Reads key from `env`, not args; logs usage                  |
| `src/stores/ai-provider-store.ts` | Deprecated for paying users; retained for free tier BYO-KEY |
| `generate-ai-grain-button.tsx`    | Conditionally skips key dialog for subscribed users         |
| `useAiGrainGeneration.ts`         | No longer sends `apiKey` to action for subscribed users     |
| `convex/convex.config.ts`         | Adds `OPENAI_API_KEY` declaration                           |

### Dev workflow

1. Create a separate OpenAI project for dev (`135ify-dev`)
2. Generate a project API key in that project
3. Set `OPENAI_API_KEY` on the Convex dev deployment
4. For local testing, the action reads the dev deployment's env var
5. The key is scoped to the dev project, so dev usage doesn't count against prod limits

---

## Summary of architecture decisions

| Decision                | Recommendation                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| Key type                | Project API key, scoped to Model Capabilities: Request                  |
| Key storage             | Convex environment variable (`OPENAI_API_KEY`)                          |
| Key delivery            | Never sent to client; read server-side in the action                    |
| Per-user tracking       | Log `usage` (input/output tokens) from API response on each job         |
| Per-user rate limiting  | App-level: check count of recent jobs per user in mutation              |
| Global rate limiting    | Optional: singleton counter for active/pending jobs                     |
| Abuse detection         | Frequency anomalies, cost spikes, failure-rate monitoring               |
| Cost monitoring         | OpenAI spend alerts (platform-level) + custom per-user cost aggregation |
| Cost enforcement        | Per-user cost caps per subscription tier + global platform kill switch  |
| Key rotation            | Manual: create new key, update Convex env var, revoke old key           |
| Key security            | IP allowlisting + scoped permissions + separate dev/prod keys           |
| Existing BYO-KEY flow   | Retained for free tier users (Zustand store + client-sent key)          |
| Action signature change | Remove `apiKey` from `processJob` args; read from `env` instead         |
