# AI grain generation alongside pre-scanned grain textures

Pre-scanned grain textures (ADR 0001) produce authentic film grain but are static — one texture, one intensity slider.
We are adding an AI-based grain generation path that produces a complete film-grain image from a Source Image in a
single model call, without user parameterization.

**How it works**: The user presses a button in the Edit View. A Convex action sends the Source Image to `gpt-5.4` via
the OpenAI Responses API (`image_generation` tool) with a fixed prompt and returns an immutable rendered image. The
output is stored as an **AI Take** — a distinct Render variant alongside the Manual Render. AI Takes are viewed and
managed on the `/takes` route.

## Key decisions

### AI is a separate pipeline, not a replacement

The existing manual pipeline (Halation → Film Tint → Vignette → Grain) is untouched. The AI path is a parallel variant:
Source Image → AI model → AI Take. Users toggle between Manual Render and AI Takes. This preserves the existing
parameter-driven experience and avoids breaking changes.

### BYO API key, stored client-side

The user provides their own OpenAI API key. The key is never persisted server-side — it lives exclusively in browser
localStorage and is passed as a Convex action argument at invocation time, used only in-memory during the action's
lifetime, then discarded.

**Full flow:**

1. User enters their OpenAI key in the `AiKeyDialog` (a password-style input with show/hide toggle).
2. Key is saved to a Zustand store (`ai-provider-store.ts`) persisted to localStorage under `"ai-provider-key"`. No
   client-side format validation — an invalid key surfaces as a failed job with the OpenAI error in `failureReason`.
3. On generation, the hook reads `apiKey` from the store and calls the Convex action `processJob({ jobId, apiKey })` —
   passing the key as a plain string argument.
4. The Convex action (Node.js runtime) instantiates `new OpenAI({ apiKey })` and makes the API call. The key is never
   written to any Convex table or `_storage`.
5. After the action returns, the key is garbage-collected with the runtime context.

**Key lifecycle:**

- One key at a time — there is no multi-key management, no key rotation UI, no provider selection.
- The retry flow (failed takes) reads from the same store, or accepts an ad-hoc key argument if none is stored.
- Clearing the key from the store does not invalidate any in-flight actions — those complete with the key already passed
  as their argument.
- The key is stored as plain text in localStorage (no encryption at rest).

**Provider abstraction:**

The `AI Provider` abstraction wraps the key lookup so switching from BYOK to a server-side platform subscription key
later is a configuration change, not a schema migration. The mutation and action signatures (`processJob` accepting
`{ jobId, apiKey }`) remain stable; the caller changes which source it resolves the key from.

**UI entry points:**

Three paths open the `AiKeyDialog`:

1. **Generate button** — if no key is stored, the dialog appears before generation begins.
2. **User menu** — "API Key" menu item (with `KeyIcon`), visible only when `VITE_FEATURE_AI_GRAIN` is enabled.
3. **Retry on pending takes** — clicking retry on a failed job opens the dialog if no key is stored.

**Feature gate:**

The entire BYOK/AI system is gated behind `VITE_FEATURE_AI_GRAIN` env var (default `false`). When disabled, all key UI
and AI grain buttons are hidden.

**Usage tracking note:**

Even though the user provides their own key, the app still records `inputTokens`, `outputTokens`, and `costCents` in the
`aiGenerationJobs` table for display in the Takes UI. This is informational only — no billing is performed against these
values.

### Over-quota: download before discard

If the generated image exceeds the user's remaining Gallery storage quota, the result is never persisted to Convex
storage. Instead, the raw base64 is returned to the client, and a popup offers "Download now" or "Discard." The API cost
is already spent; the user decides whether to keep a local copy.

### Fire-and-forget generation

AI generation is a Convex action. It always completes, even if the user navigates away or closes the tab. The AI Take
appears in the Takes route when done.

## Considered options

- **Procedural AI grain (in-browser model)**: Rejected — in-browser models cannot match the quality of `gpt-5.4` for
  image-to-image tasks. Introduces WebGPU/ONNX compatibility matrix and model loading UX.
- **Server-side key storage**: Rejected for MVP — introduces key custody liability. Provider abstraction makes migration
  trivial later.
- **Single-slot AI Take (replace on re-roll)**: Rejected — users want to compare generations. Multiple AI Takes per
  Source Image gives them selection freedom.
