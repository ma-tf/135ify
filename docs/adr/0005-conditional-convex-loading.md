# Conditional Convex loading via dynamic import

The Convex client library (`convex/react`, `@convex-dev/auth/react`) adds ~50-100 KB to the index chunk even when the
sign-in feature is disabled. ES module hoisting means static imports are always bundled regardless of runtime
conditionals — `if (FEATURE_SIGN_IN)` guards only prevent execution, not inclusion.

We use dynamic `import()` inside `if (FEATURE_SIGN_IN)` guards in `main.tsx` and `storage-provider.tsx`. Since
`FEATURE_SIGN_IN` is a build-time constant (replaced by Vite from `import.meta.env`), the bundler eliminates the dead
code including the dynamic imports themselves. Convex is completely absent from the bundle when sign-in is disabled.

This is a deliberate deviation from the conventional top-level import pattern. The Convex docs show static imports; we
use dynamic imports behind feature flags for bundle optimization.
