# 135ify

A web application for giving digital images a filmic look by simulating the characteristics of 135 (35mm) film
photography.

## Language

**Source Image**: A digital image uploaded or selected by the user. The input to processing. Format-agnostic (JPEG, PNG,
WebP, etc.).

**Grain**: A texture overlay applied during processing, sourced from a Grain Texture, to simulate film grain. Controlled
by a single **intensity** parameter (scalar).

**Grain Texture**: An image file — typically a scan of blank film — used as the grain overlay pattern. Provided as a
static asset, not uploaded by the user per session.

**Vignette**: Parametric edge darkening applied during processing. Controlled by **intensity** (scalar: how dark the
edges become) and **feather** (scalar: how gradually the darkening transitions from center to edge).

**Halation**: A reddish glow around bright highlights, simulating light penetrating the film emulsion and reflecting off
the camera pressure plate back into the red-sensitive layer. Controlled by **intensity** (scalar: opacity of the glow),
**spread** (scalar: how far the glow bleeds), and **threshold** (scalar: minimum luminance required to trigger the
glow).

**Render**: The output image after processing. Displayed as a preview in the browser and available for download.

**Preview Render**: A Render downscaled to 1200px on its longest dimension for display in the Film Strip. Generated
lazily after each parameter change.

**Full Render**: A Render at the Source Image's original resolution. Generated on demand (download or magnifying glass
inspection).

**Process** (verb): The act of transforming a Source Image into a Render by applying Halation, Film Tint, Vignette, and
Grain.

_Avoid_: Transform, filter, generate, "135ify" as a verb

**Film Stock**: A named tint preset (e.g., Natural, Golden Hour, Seabreeze, Faded, Whisper) that applies a specific
colour shift to the Source Image during processing.

_Avoid_: Film preset, tint preset

**Film Strip**: The horizontal row of rendered images, styled with sprocket-hole decoration, through which the user
navigates Source Images and their Renders. Always rendered in the root layout.

_Avoid_: Carousel, gallery, film strip

**Edit View**: The route-based overlay at `/image/$fileId` where a user adjusts processing parameters for a Source
Image. Replaces the former EditSheet component. Editing components live in `src/features/image/`.

_Avoid_: EditSheet, edit modal

**Account**: An authenticated user identity, linked to a History. Required for server-side persistence of Source Images
and processing parameters.

_Avoid_: User, profile

**History**: The persistent collection of a user's saved Source Images and their processing parameters, stored
server-side. Accessible only when authenticated. Each Source Image in History is identified by a unique document ID and
can be loaded back into the Film Strip for re-editing.

_Avoid_: Gallery, library, collection

**Session**: The authenticated state of a user within a browser tab. Determines whether auto-save is active and whether
History is accessible. Sessions are managed by Convex Auth and are independent across browser tabs.

**FileRecord**: What the storage layer persists for each Source Image: identity (id, fileName, sourceUrl) and processing
parameters (ProcessParams). Returned by the Storage Facade. Does not include ephemeral render state.

_Avoid_: FileWithState (use FileRecord for storage-layer concerns)

**RenderState**: Ephemeral client-side processing state for a Source Image: render URL, processing flag, and error
message. Not persisted server-side. Managed by a separate Zustand store.

_Avoid_: Mixing into FileRecord or Storage Facade

**Storage Facade**: The interface (StorageContextValue) that both persistence implementations (Convex, Zustand) conform
to. Provides file CRUD (add, remove) and parameter updates. Does not manage render state.

_Aavoid_: StorageProvider, storage layer

## Relationships

- Each **Source Image** carries its own independent processing parameters and **Render**.
- A **Source Image** is **processed** once to produce a **Render**.
- **Grain** is applied using a **Grain Texture** as its pattern source.
- **Vignette** is applied independently; **Grain** and **Vignette** compose into the **Render**.
- **Halation** is derived from bright regions of the Source Image and composited into the Render.
- Processing order: Halation (derived from source), Film Tint, Vignette, Grain (final).
- An **Account** owns a **History** containing multiple Source Images and their parameters.
- A **Session** determines whether an **Account**'s **History** is accessible and whether auto-save is active.
- Source Images in **History** are re-processed client-side on load using stored parameters; Render output is not
  persisted server-side.
- A **FileRecord** is composed with a **RenderState** at the UI layer to produce the full view model for a Source Image.
- The **Storage Facade** is independent of render state management; composition happens in FileProvider.
- The **Film Strip** is always rendered in the root layout. The **Edit View** opens as a Sheet overlay on top of it.

## Example dialogue

> **Dev:** "When I process a Source Image, does the Grain apply before or after the Vignette?" **Domain expert:** "Apply
> Vignette first, then Grain on top. The film grain should sit over the darkened edges, not underneath them." **Dev:**
> "And can the user provide their own Grain Texture?" **Domain expert:** "Not in MVP. There's one fixed Grain Texture.
> The only control is intensity."
