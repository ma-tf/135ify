# 135ify

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/ma-tf/135ify/blob/main/COPYING)
[![fallow health](https://ma-tf.github.io/135ify/badge.svg)](https://fallow.tools)

Give a digital image a more analogue appearance.

## Environment Variables

### Convex Environment Variables (non-secret)

Set via `npx convex env set <VAR> <VALUE>`.

| Variable                             | Required | Default | Description                                                 |
| ------------------------------------ | -------- | ------- | ----------------------------------------------------------- |
| `FREE_TIER_IMAGE_LIMIT`              | No       | `36`    | Max images in a free-tier user's gallery                    |
| `FREE_TIER_FILE_SIZE_MB`             | No       | `10`    | Max upload file size (MB) for free-tier users               |
| `FREE_TIER_STORAGE_MB`               | No       | `360`   | Max storage (MB) for free-tier users                        |
| `PAID_TIER_IMAGE_LIMIT`              | No       | `360`   | Max images in a paid-tier user's gallery                    |
| `PAID_TIER_FILE_SIZE_MB`             | No       | `25`    | Max upload file size (MB) for paid-tier users               |
| `PAID_TIER_STORAGE_MB`               | No       | `9216`  | Max storage (MB) for paid-tier users                        |
| `OPENAI_MONTHLY_SPEND_LIMIT_CENTS`   | No       | `500`   | Per-user monthly AI spend cap in cents (e.g. `500` = $5.00) |
| `SITE_URL`                           | No       | —       | Public site URL, used for Stripe checkout redirects         |
| `STRIPE_STORAGE_PRICE_ID`            | No       | —       | Stripe price ID for the storage subscription product        |
| `STRIPE_AI_PRICE_ID`                 | No       | —       | Stripe price ID for the AI generation subscription product  |
| `AI_GENERATION_RATE_LIMIT_RATE`      | No       | `5`     | AI requests allowed per user, per period                    |
| `AI_GENERATION_RATE_LIMIT_PERIOD_MS` | No       | `60000` | Rate limit period in ms (1 minute)                          |
| `AI_GENERATION_GLOBAL_RATE`          | No       | `60`    | Global AI requests allowed per period                       |
| `AI_GENERATION_GLOBAL_PERIOD_MS`     | No       | `60000` | Global rate limit period in ms                              |

### Convex Secrets

Set via `npx convex env set <VAR> <VALUE>`. Values are hidden in the Convex dashboard.

| Variable                | Used by            | Description                                              |
| ----------------------- | ------------------ | -------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe SDK         | Stripe API secret key (`sk_test_...` or `sk_live_...`)   |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks    | Stripe webhook endpoint signing secret (`whsec_...`)     |
| `OPENAI_API_KEY`        | OpenAI SDK         | OpenAI API key for AI generation                         |
| `AUTH_GITHUB_ID`        | `@auth/core`       | GitHub OAuth app client ID                               |
| `AUTH_GITHUB_SECRET`    | `@auth/core`       | GitHub OAuth app client secret                           |
| `AUTH_GOOGLE_ID`        | `@auth/core`       | Google OAuth app client ID                               |
| `AUTH_GOOGLE_SECRET`    | `@auth/core`       | Google OAuth app client secret                           |
| `AUTH_TWITTER_ID`       | `@auth/core`       | Twitter OAuth app client ID                              |
| `AUTH_TWITTER_SECRET`   | `@auth/core`       | Twitter OAuth app client secret                          |
| `JWKS`                  | `@convex-dev/auth` | JSON Web Key Set for token verification (auto-generated) |
| `JWT_PRIVATE_KEY`       | `@convex-dev/auth` | RSA private key for JWT signing (auto-generated)         |

> Auth secrets (`AUTH_*`, `JWKS`, `JWT_PRIVATE_KEY`) aren't declared in `convex.config.ts` — they're read directly by
> the `@convex-dev/auth` and `@auth/core` libraries.

### Vite Environment Variables (`.env.local`)

| Variable                     | Default | Description                                                                         |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `VITE_CONVEX_URL`            | —       | Convex deployment HTTP URL (`https://<deployment>.convex.cloud`)                    |
| `VITE_CONVEX_SITE_URL`       | —       | Convex deployment site URL (`https://<deployment>.convex.site`), for auth callbacks |
| `VITE_FEATURE_AI_GRAIN`      | `false` | Toggle AI grain feature on/off                                                      |
| `VITE_FEATURE_SIGN_IN`       | `false` | Toggle sign-in on/off                                                               |
| `VITE_FEATURE_SUBSCRIPTIONS` | `false` | Toggle Stripe subscriptions on/off                                                  |
| `VITE_FILE_SIZE_LIMIT_MB`    | `5`     | Client-side upload file size limit in MB                                            |
| `VITE_BASE_PATH`             | `/`     | Base URL path for the app                                                           |

## Licence

Copyright (C) 2026 Matt F

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public
License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see
<https://www.gnu.org/licenses/>.
