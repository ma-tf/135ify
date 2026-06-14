# 0002: Per-image processing state

## Status

Accepted

## Context

135ify initially stored processing parameters (film preset, halation, vignette, grain) in a single global store
(`ParameterStore`). Only one set of sliders existed, shared across all uploaded images. The render state (`RenderStore`)
was similarly global — one render URL at a time, tied to the active file.

This worked while the app showed a single preview alongside always-visible controls. But introducing per-image editing
(tap an image → dialog with its own controls) breaks the global model: changing a slider now needs to affect one
specific image's parameters, not all of them.

Alternatives considered:

1. **Global params + active-file routing** — keep params global, route them to the active file. The dialog reads globals
   on open, writes them back on close. Saves storage duplication but creates sync problems: changing image A's params,
   then opening image B without closing shows B with A's params still in the sliders.

2. **Store of parameter sets keyed by file ID** — keep a separate `Map<FileID, Params>` in a new store. Decouples params
   from the file entry but requires three stores to stay in sync (files, params, renders).

3. **Per-image state on the file object** — each file entry in the store carries its own `params`, `renderUrl`,
   `isProcessing`, and `renderError`. A single source of truth, no cross-store sync.

## Decision

Adopt option 3: embed per-image state directly on the file entry in `file-store.ts`.

```ts
interface FileWithState {
  file: File | FileMetadata;
  id: string;
  preview: string;
  params: {
    selectedFilmId: FilmId;
    halationIntensity: number;
    halationSpread: number;
    halationThreshold: number;
    vignetteIntensity: number;
    vignetteFeather: number;
    grainIntensity: number;
  };
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
}
```

All defaults are 0, meaning "no processing applied" — the UI skips processing entirely when params match defaults.

## Consequences

- **Positive**: Single source of truth — no cross-store sync to maintain. Adding a new image creates a self-contained
  state record.
- **Positive**: Simple UI wiring — `ControlsPanel` reads/writes `activeFile.params` directly.
- **Positive**: Easy to persist (serialize the files array as-is).
- **Negative**: Slightly more data in the file store when many images are loaded, though params are negligible (~50
  bytes per image).
- **Migration**: `ParameterStore` and `RenderStore` are deleted. All consumers must be updated to read from `fileStore`.
