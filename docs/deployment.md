# Deployment

Two flows:

```
push to master     → ci.yml:  validate → vp build (staging URL) → upload dist-staging
                     cd.yml:  download dist-staging → deploy to GitHub Pages
tag v* on master   → ci.yml:  validate → vp build (prod URL)    → upload dist-prod
                     cd.yml:  download dist-prod → npx convex deploy → deploy to Netlify
```

Requires one Convex project with dev and prod deployments, plus two OAuth app sets (one per Convex deployment). Local
development and the GitHub Pages staging site both point to the dev deployment; the Netlify production site points to
the prod deployment.

---

## Create the Convex project

Create one Convex project via the [Convex dashboard](https://dashboard.convex.dev) or by running `npx convex dev`. The
project provides two deployments:

- **dev** — used by local development and the GitHub Pages staging site. Updated via `npx convex dev`. The staging
  frontend disables the sign-in feature flag so public visitors cannot create accounts or upload images.
- **prod** — used by the Netlify production site. Deployed automatically on `v*` tags via `npx convex deploy` in CI.

For the prod deployment, go to **Settings → Deploy Keys**. Create a deploy key and copy its value. This key is needed as
a GitHub secret (`CONVEX_DEPLOY_KEY`).

## Create OAuth apps

Each provider needs a callback URL per Convex deployment. Find each deployment's `CONVEX_SITE_URL` in the dashboard
(looks like `https://adjective-animal-123.convex.site`).

### GitHub

Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers).

**Dev deployment (for staging):**

- Homepage URL: the GitHub Pages URL
- Authorization callback URL: `https://{dev-convex-site}/api/auth/callback/github`

**Prod deployment:**

- Homepage URL: the Netlify URL
- Authorization callback URL: `https://{prod-convex-site}/api/auth/callback/github`

Generate a client secret for each. Copy the Client ID and Client Secret.

### Google

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

**Dev deployment (for staging):**

- Authorized redirect URI: `https://{dev-convex-site}/api/auth/callback/google`

**Prod deployment:**

- Authorized redirect URI: `https://{prod-convex-site}/api/auth/callback/google`

Copy the Client ID and Client Secret for each.

### Twitter

Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).

**Dev deployment (for staging):**

- App type: Web App
- Callback URI: `https://{dev-convex-site}/api/auth/callback/twitter`

**Prod deployment:**

- App type: Web App
- Callback URI: `https://{prod-convex-site}/api/auth/callback/twitter`

Copy the Client ID and Client Secret for each.

## Set Convex environment variables

Open the Convex project dashboard → Settings → Environment Variables. Select the dev deployment to set staging
variables; select prod for production.

### Dev deployment (staging)

| Variable              | Value                         |
| --------------------- | ----------------------------- |
| `SITE_URL`            | GitHub Pages URL              |
| `AUTH_GITHUB_ID`      | Staging GitHub Client ID      |
| `AUTH_GITHUB_SECRET`  | Staging GitHub Client Secret  |
| `AUTH_GOOGLE_ID`      | Staging Google Client ID      |
| `AUTH_GOOGLE_SECRET`  | Staging Google Client Secret  |
| `AUTH_TWITTER_ID`     | Staging Twitter Client ID     |
| `AUTH_TWITTER_SECRET` | Staging Twitter Client Secret |

### Production deployment

| Variable                | Value                                       |
| ----------------------- | ------------------------------------------- |
| `SITE_URL`              | Netlify URL                                 |
| `AUTH_GITHUB_ID`        | Prod GitHub Client ID                       |
| `AUTH_GITHUB_SECRET`    | Prod GitHub Client Secret                   |
| `AUTH_GOOGLE_ID`        | Prod Google Client ID                       |
| `AUTH_GOOGLE_SECRET`    | Prod Google Client Secret                   |
| `AUTH_TWITTER_ID`       | Prod Twitter Client ID                      |
| `AUTH_TWITTER_SECRET`   | Prod Twitter Client Secret                  |
| `FILE_SIZE_LIMIT_BYTES` | `524288` (0.5 MB) server-side file size cap |
| `GALLERY_IMAGE_LIMIT`   | `10` server-side image count cap            |

## Set GitHub Actions variables

Go to repo → Settings → Secrets and variables → Actions → Variables.

| Variable             | Value                                   |
| -------------------- | --------------------------------------- |
| `VITE_BASE_PATH`     | GitHub Pages base path (e.g. `/135ify`) |
| `STAGING_CONVEX_URL` | Dev Convex deployment URL               |
| `PROD_CONVEX_URL`    | Production Convex deployment URL        |

## Set GitHub Actions secrets

Go to repo → Settings → Secrets and variables → Actions → New repository secret.

| Secret               | Value                             |
| -------------------- | --------------------------------- |
| `CONVEX_DEPLOY_KEY`  | Prod Convex deployment deploy key |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token     |
| `NETLIFY_SITE_ID`    | Netlify site API ID               |

## Enable GitHub Pages

Go to repo → Settings → Pages. Source: GitHub Actions.

## First staging deployment

Push to master:

```
git push
```

Go to repo → Actions tab. Verify the CI workflow runs and succeeds. Visit the GitHub Pages URL and confirm the app
loads.

## First production deployment

Tag a commit and push:

```
git tag v0.1.0
git push origin v0.1.0
```

Verify the CI workflow runs, then the CD workflow triggers and succeeds. Visit the Netlify URL and confirm the app
loads.

## Verify auth flow

On each environment, sign in with each provider (GitHub, Google, Twitter) and confirm you land back on the site,
authenticated.

---

## Troubleshooting

| Symptom                                                  | Check                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| CI fails on `vp check` or `vp test`                      | Fix the code issue and push again                                       |
| CI fails on `vp build`                                   | Confirm `STAGING_CONVEX_URL` or `PROD_CONVEX_URL` var is set            |
| CD triggers but workflow_run event shows no matching run | The CI workflow must be on the default branch (master)                  |
| CD deploy-prod job doesn't run                           | Tag must match `v*` pattern (e.g. `v0.1.0`)                             |
| OAuth redirects to wrong URL                             | `SITE_URL` env var in Convex dashboard matches the frontend URL         |
| OAuth callback fails                                     | Callback URL registered with provider matches `CONVEX_SITE_URL` exactly |
| Netlify deploy fails                                     | `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets are correct          |
