/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiGenerationJobs from "../aiGenerationJobs.js";
import type * as aiGenerationJobsActions from "../aiGenerationJobsActions.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as lib from "../lib.js";
import type * as modelPricing from "../modelPricing.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as stripe from "../stripe.js";
import type * as stripeProcessor from "../stripeProcessor.js";
import type * as stripeSync from "../stripeSync.js";
import type * as stripeWebhooks from "../stripeWebhooks.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiGenerationJobs: typeof aiGenerationJobs;
  aiGenerationJobsActions: typeof aiGenerationJobsActions;
  auth: typeof auth;
  config: typeof config;
  http: typeof http;
  images: typeof images;
  lib: typeof lib;
  modelPricing: typeof modelPricing;
  rateLimiter: typeof rateLimiter;
  stripe: typeof stripe;
  stripeProcessor: typeof stripeProcessor;
  stripeSync: typeof stripeSync;
  stripeWebhooks: typeof stripeWebhooks;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
