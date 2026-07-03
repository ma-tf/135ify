# 0006: Dual-host deployment with 2 Convex deployments across 3 frontend environments

A GitHub repo gets exactly one Pages site. To have both a public staging environment (preview changes on master) and a
production environment (released via version tags), production must live on a separate host. We chose Netlify.

Convex follows the same split: one Convex project with two deployments — **dev** (shared by local development and the
GitHub Pages staging site) and **prod** (used by the Netlify production site). On staging, the sign-in feature flag is
disabled to prevent public users from polluting the dev database with test accounts and uploaded images.

A future reader might reasonably expect (a) one host for both environments, or (b) one Convex deployment per frontend
environment. Both assumptions are wrong for pragmatic reasons rather than deep trade-offs, but the structure is
surprising enough to record.
