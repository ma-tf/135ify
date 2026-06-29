# Deployment Checklist

Sets up automated deployment of a branch to GitHub Pages with a separate Convex project and separate OAuth apps.

---

## Create the Convex project

Run `npx convex dev` in a separate checkout or create via the [Convex dashboard](https://dashboard.convex.dev).

Note the project name.

Go to **Settings → Deploy Keys**. Create a deploy key, and copy its value. You will use it in the GitHub Actions secrets
step.

## Create OAuth apps

Each provider needs the Convex callback URL registered. Find your `CONVEX_SITE_URL` in the project dashboard (it looks
like `https://adjective-animal-123.convex.site`).

### GitHub

Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers). Create a New OAuth App.

Homepage URL: the URL where the frontend is served Authorization callback URL:
`https://{convex-site-url}/api/auth/callback/github`

Generate a client secret. Copy the Client ID and Client Secret.

### Google

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Create a project → APIs & Services →
Credentials → Create OAuth client ID.

Authorized redirect URI: `https://{convex-site-url}/api/auth/callback/google`

Copy the Client ID and Client Secret.

### Twitter

Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard). Create a project and app → Set up
User authentication (OAuth 2.0).

App type: Web App Callback URI: `https://{convex-site-url}/api/auth/callback/twitter`

Copy the Client ID and Client Secret.

## Set Convex environment variables

Open the project dashboard → Settings → Environment Variables.

| Variable              | Value                                |
| --------------------- | ------------------------------------ |
| `SITE_URL`            | The URL where the frontend is served |
| `AUTH_GITHUB_ID`      | GitHub Client ID                     |
| `AUTH_GITHUB_SECRET`  | GitHub Client Secret                 |
| `AUTH_GOOGLE_ID`      | Google Client ID                     |
| `AUTH_GOOGLE_SECRET`  | Google Client Secret                 |
| `AUTH_TWITTER_ID`     | Twitter Client ID                    |
| `AUTH_TWITTER_SECRET` | Twitter Client Secret                |

## Set GitHub Actions secrets

Go to repo → Settings → Secrets and variables → Actions → New repository secret.

| Secret              | Value                                       |
| ------------------- | ------------------------------------------- |
| `CONVEX_DEPLOY_KEY` | The deploy key from the Convex project step |

## Add the deployment workflow

Create `.github/workflows/deploy.yml`. Commit and push.

## Enable GitHub Pages

Go to repo → Settings → Pages.

Source: GitHub Actions.

## First deployment

Create and push the deployment branch:

```
git checkout -b {branch}
git push -u origin {branch}
```

Go to repo → Actions tab. Verify the workflow runs and succeeds. Visit the GitHub Pages URL and confirm the app loads.

## Verify auth flow

Sign in with each provider (GitHub, Google, Twitter) and confirm you land back on the site, authenticated.

---

## Troubleshooting

| Symptom                               | Check                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Workflow fails on `npx convex deploy` | `CONVEX_DEPLOY_KEY` secret is correct and not revoked                   |
| OAuth redirects to wrong URL          | `SITE_URL` env var matches the frontend URL                             |
| OAuth callback fails                  | Callback URL registered with provider matches `CONVEX_SITE_URL` exactly |
