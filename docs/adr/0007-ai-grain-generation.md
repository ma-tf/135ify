# AI grain generation alongside pre-scanned grain textures

Pre-scanned grain textures (ADR 0001) produce authentic film grain but are static — one texture, one intensity slider.
We are adding an AI-based grain generation path that produces a complete film-grain image from a Source Image in a
single model call, without user parameterization.

**How it works**: The user presses a button in the Edit View. A Convex action sends the Source Image to GPT-4o with a
fixed prompt and returns an immutable rendered image. The output is stored as an **AI Take** — a distinct Render variant
alongside the Manual Render. AI Takes are viewed and managed on the `/takes` route.

## Key decisions

### AI is a separate pipeline, not a replacement

The existing manual pipeline (Halation → Film Tint → Vignette → Grain) is untouched. The AI path is a parallel variant:
Source Image → AI model → AI Take. Users toggle between Manual Render and AI Takes. This preserves the existing
parameter-driven experience and avoids breaking changes.

### BYO API key, stored client-side

The user provides their own OpenAI API key, stored in localStorage. The key never touches Convex storage. This avoids
server-side custody liability. An AI Provider abstraction wraps the key lookup so switching to a platform subscription
key later is a configuration change, not a schema migration.

### Over-quota: download before discard

If the generated image exceeds the user's remaining Gallery storage quota, the result is never persisted to Convex
storage. Instead, the raw base64 is returned to the client, and a popup offers "Download now" or "Discard." The API cost
is already spent; the user decides whether to keep a local copy.

### Fire-and-forget generation

AI generation is a Convex action. It always completes, even if the user navigates away or closes the tab. The AI Take
appears in the Takes route when done.

## Considered options

- **Procedural AI grain (in-browser model)**: Rejected — in-browser models cannot match the quality of GPT-4o for
  image-to-image tasks. Introduces WebGPU/ONNX compatibility matrix and model loading UX.
- **Server-side key storage**: Rejected for MVP — introduces key custody liability. Provider abstraction makes migration
  trivial later.
- **Single-slot AI Take (replace on re-roll)**: Rejected — users want to compare generations. Multiple AI Takes per
  Source Image gives them selection freedom.
