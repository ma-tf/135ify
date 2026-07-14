import { RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";
import {
  AI_GENERATION_GLOBAL_PERIOD_MS,
  AI_GENERATION_GLOBAL_RATE,
  AI_GENERATION_RATE_LIMIT_PERIOD_MS,
  AI_GENERATION_RATE_LIMIT_RATE,
} from "./config";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiGenerationGlobal: {
    kind: "token bucket",
    rate: AI_GENERATION_GLOBAL_RATE,
    period: AI_GENERATION_GLOBAL_PERIOD_MS,
  },
  aiGenerationPerUser: {
    kind: "token bucket",
    rate: AI_GENERATION_RATE_LIMIT_RATE,
    period: AI_GENERATION_RATE_LIMIT_PERIOD_MS,
    capacity: 2,
  },
});
