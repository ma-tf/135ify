# 0003: Convex as backend

## Status

Accepted

## Context

135ify is currently a purely client-side application — no backend, no database, no authentication. Images exist only in
the browser's memory and are lost on page refresh. Adding user accounts and a persistent gallery requires a backend.

Alternatives considered:

1. **Supabase** — managed Postgres + auth + storage. Strong ecosystem, generous free tier. Requires integrating three
   separate services (Auth, Database, Storage) and managing RLS policies.

2. **Firebase** — Google's managed backend. Auth + Firestore + Storage. Similar to Supabase but tied to Google
   ecosystem. Real-time sync is possible but requires explicit snapshot listeners.

3. **Custom backend** — Node/Express/Fastify with Postgres + S3. Maximum control, maximum maintenance burden.

4. **Convex** — reactive backend-as-a-service with built-in database, file storage, and auth. Provides real-time
   WebSocket-based query synchronization across tabs automatically. First-class React hooks (`useQuery`, `useMutation`).
   Auth via Convex Auth (magic links, OAuth) or third-party providers (Clerk, Auth0).

## Decision

Adopt Convex as the backend. Use Convex Auth (built-in) for authentication.

Convex was chosen because:

- **Real-time sync**: Queries are reactive — multiple browser tabs automatically stay in sync without custom WebSocket
  code. This eliminates the "last write wins" problem of storing state in Zustand alone.
- **Integrated services**: Auth, database, and file storage in one package with a single SDK. No need to wire together
  separate Supabase Auth + Database + Storage.
- **React-native API**: `useQuery` and `useMutation` hooks integrate naturally with the existing React + Zustand
  architecture.
- **Zero infrastructure**: No servers to manage. Convex handles scaling, caching, and WebSocket connections.
- **File storage**: Source Images are uploaded via generated upload URLs and served via HTTPS. No need for external S3
  or CDN configuration.

## Consequences

- **Positive**: Multi-tab sync works automatically via Convex's reactive queries.
- **Positive**: Single SDK for auth, database, and file storage reduces integration complexity.
- **Positive**: `VITE_CONVEX_URL` env var is the only configuration needed for deployment (compatible with GitHub
  Pages).
- **Negative**: Vendor lock-in — migrating away from Convex would require replacing the reactive query layer, file
  storage, and auth system.
- **Negative**: Convex Auth is in beta. May have backward-incompatible changes.
- **Negative**: Free tier limits apply (storage, bandwidth). Tighter upload limits (5MB) are needed to stay within
  bounds.
