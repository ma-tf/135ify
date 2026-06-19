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

## Other conventions

- Use Zustand for state management; single-store pattern in `src/stores/`
- Use path aliases for imports: `@/`, `@stores/`, `@features/`, `@hooks/`, `@components/`, `@ui/`, `@lib/`, `@utils/`
- Vite+ toolchain: run `vp check` and `vp test` before committing
- Never use `store.getState()` — always use the hook (`useStore(selector)`) to access store values. `getState()`
  bypasses React's reactivity and leads to stale reads.
- Conventional commits enforced via commitlint (72 char limit)
