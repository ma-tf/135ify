# Code conventions

- Avoid prop drilling where alternatives are available (Zustand store, context, hooks)
- Use Zustand for state management; single-store pattern in `src/stores/`
- Use path aliases for imports: `@/`, `@stores/`, `@features/`, `@hooks/`, `@components/`, `@ui/`, `@lib/`, `@utils/`
- Vite+ toolchain: run `vp check` and `vp test` before committing
- Conventional commits enforced via commitlint (72 char limit)
