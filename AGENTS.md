# Agents

## Agent skills

### Issue tracker

GitHub Issues at `ma-tf/135ify` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Mapped 1:1 to the canonical role names — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Code conventions

## Toolchain

Vite+ toolchain + Convex backend. See `docs/agents/toolchain.md`.

## Because the agent NEVER listens

- ALWAYS FOLLOW CONVENTIONS: `docs/agents/code-conventions.md`
- NEVER use `store.getState()`
- ALWAYS use the hook (`useStore(() => {}))`) to access store values.
- Use `vp`. Never use `npm` or `npx`
