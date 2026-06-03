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

**Render**: The output image after processing. Displayed as a preview in the browser and available for download.

**Process** (verb): The act of transforming a Source Image into a Render by applying Grain and Vignette.

_Avoid_: Transform, filter, generate, "135ify" as a verb

## Relationships

- A **Source Image** is **processed** once to produce a **Render**.
- **Grain** is applied using a **Grain Texture** as its pattern source.
- **Vignette** is applied independently; **Grain** and **Vignette** compose into the **Render**.

## Deferred

**Film Stock**: A named preset of Grain and Vignette parameters. Deferred until named stocks exist beyond the MVP
unnamed default.

## Example dialogue

> **Dev:** "When I process a Source Image, does the Grain apply before or after the Vignette?" **Domain expert:** "Apply
> Vignette first, then Grain on top. The film grain should sit over the darkened edges, not underneath them." **Dev:**
> "And can the user provide their own Grain Texture?" **Domain expert:** "Not in MVP. There's one fixed Grain Texture.
> The only control is intensity."
