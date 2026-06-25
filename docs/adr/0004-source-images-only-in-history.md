# 0004: Source Images only in the Gallery

## Status

Accepted

## Context

When persisting images to a user's Gallery, we need to decide what data to store. A Source Image plus its processing
parameters can produce a Render. The question is whether to store:

1. **Source Images only** — store the uploaded file and processing parameters. Re-generate the Render client-side on
   load.
2. **Source Images + Preview Renders** — store the uploaded file, parameters, and the 1200px downscaled preview.
3. **Source Images + Preview + Full Renders** — store everything, including download-ready full-resolution output.

The processing pipeline is deterministic — given the same Source Image and `FileParams`, `processImage()` produces the
same output every time. This means Renders are fully reconstructable from their inputs.

Alternatives considered:

1. **Store Renders** — avoids re-processing on load, but wastes storage. A 5MB Source Image at full resolution could
   produce a similar-sized Render. Doubling storage for no visual benefit. Preview Renders at 1200px are smaller but
   still redundant given deterministic re-processing.

2. **Store Source + Preview** — middle ground, but adds complexity: two files per image in storage, and the Preview must
   be regenerated if parameters change (making it not truly "stored").

3. **Store Source only** — one file per image. Parameters are stored in the database document. Re-processing on load is
   fast (preview is 1200px, typically under 200ms). Full-resolution Renders are generated on demand for download.

## Decision

Adopt option 3: store Source Images only. Re-process client-side on load using stored parameters.

The `images` table stores:

```
{
  _id: Id<"images">
  _creationTime: number
  userId: Id<"users">
  sourceStorageId: Id<"_storage">
  fileName: string
  params: FileParams
}
```

Parameters are always saved, even when they match defaults. This ensures loading an image from the Gallery always
reproduces the exact editing state.

## Consequences

- **Positive**: Storage is halved — one file per image instead of two or three.
- **Positive**: Parameters are the single source of truth for visual output. No risk of stale Renders.
- **Positive**: Simple upload flow — one file, one storage ID, one database record.
- **Negative**: Re-processing is required on every load. Preview renders (1200px) are fast (~200ms) but introduce a
  brief loading state when navigating to `/gallery/<uuid>`.
- **Negative**: Full-resolution Renders are not pre-cached. Download requires re-processing at original resolution,
  which may take several seconds for large images.
