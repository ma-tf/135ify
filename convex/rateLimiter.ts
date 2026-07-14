import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

const perUserRate = Number(process.env.AI_GENERATION_RATE_LIMIT_RATE || "5");
const perUserPeriod = Number(process.env.AI_GENERATION_RATE_LIMIT_PERIOD_MS || String(MINUTE));
const globalRate = Number(process.env.AI_GENERATION_GLOBAL_RATE || "60");
const globalPeriod = Number(process.env.AI_GENERATION_GLOBAL_PERIOD_MS || String(MINUTE));

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiGenerationGlobal: { kind: "token bucket", rate: globalRate, period: globalPeriod },
  aiGenerationPerUser: {
    kind: "token bucket",
    rate: perUserRate,
    period: perUserPeriod,
    capacity: 2,
  },
});
