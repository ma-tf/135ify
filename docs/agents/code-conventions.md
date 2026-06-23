# Code conventions

## No prop drilling

A component must pull its own state. Never accept state as a prop solely to forward it to a child.

**Decision tree:**

1. **Global/shared state** → Zustand store in `src/stores/`
2. **Scoped per-instance state** → React Context + hook in `src/providers/` or `src/features/*/`
3. **Derived values or actions from existing state** → custom hook in `src/hooks/` or colocated in feature
4. **User-initiated callbacks** (onClick, onSubmit) → props are acceptable

**Acceptable props:** UI primitives (label, className, children), user-initiated callbacks, or configuration values that
are constant for the component's lifetime.

## No consts after an if

A `const` declaration must never follow an `if` guard. Move the declaration above the guard.

Example — bad:

```tsx
function Profile() {
  if (!user) return null;
  const name = user.name;
  return <div>{name}</div>;
}
```

Example — good:

```tsx
function Profile() {
  const name = user?.name;
  if (!user) return null;
  return <div>{name}</div>;
}
```

## Other conventions

- Use Zustand for state management; single-store pattern in `src/stores/`
- **No relative imports.** All imports must use path aliases (`@features/`, `@hooks/`, `@stores/`, `@components/`,
  `@lib/`, `@providers/`, `@/`, etc.). The only exception is `routeTree.gen.ts`, which is auto-generated and excluded
  from linting via `ignorePatterns`.
- Vite+ toolchain: run `vp check` and `vp test` before committing
- Never use `store.getState()` — always use the hook (`useStore(selector)`) to access store values. `getState()`
  bypasses React's reactivity and leads to stale reads.
- Conventional commits enforced via commitlint (72 char limit)
