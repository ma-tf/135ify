# Grain from film scans, not procedural generation

Grain is applied by blending a pre-scanned film texture image (Grain Texture) over the Source
Image. We rejected generating grain procedurally (e.g., Perlin noise, random pixel scatter) because
real film scans capture the actual grain structure of 135 film — clumping, directionality, and tonal
response that are hard to reproduce algorithmically.

**Trade-off**: Procedural grain requires no static assets, is resolution-independent, and is
infinitely tunable. Film-scan grain is visually authentic but bound to the resolution and character
of a single scan, and requires a carefully prepared asset.

**Considered alternatives**:

- Procedural noise (canvas `createImageData`, simplex/Perlin) — rejected: lacks the organic
  structure of real film grain.
- Hybrid (procedural base tuned by scan samples) — rejected: overengineered for MVP. Revisit if
  resolution-scaling becomes a problem.
