# OpenAI image-to-image generation research

Research on using OpenAI models for image-to-image transformation (adding film grain to a digital photo). All
information sourced from official `platform.openai.com` documentation.

**Sources consulted:**

- [Models page](https://platform.openai.com/docs/models) — current model catalog
- [Images and vision guide](https://platform.openai.com/docs/guides/images-vision) — multimodal input/output
- [Image generation guide](https://platform.openai.com/docs/guides/image-generation) — generation and editing APIs
- [GPT Image prompting cookbook](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide) —
  prompt engineering for image models
- [Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) — general prompting
- [SDKs and CLI](https://platform.openai.com/docs/libraries) — Node.js SDK setup

---

## 1. Which model?

### Current models that support image input and image output

The OpenAI API offers two paths for image generation:

**Image API** — direct image generation/editing with dedicated image models:

- `gpt-image-2` (**recommended default** for new builds). State-of-the-art. Highest-quality generation and editing,
  identity-sensitive edits, text-heavy images, photorealism. Supports arbitrary resolutions up to ~8.3M pixels.
- `gpt-image-1.5` — legacy, kept for backward compatibility during migration.
- `gpt-image-1` — legacy compatibility only.
- `gpt-image-1-mini` — cost-efficient option for high-volume batch generation and rapid ideation.

**Responses API** — conversational image generation via the `image_generation` tool:

- Mainline models like `gpt-5.6` (and other GPT-5.x models) support the `image_generation` tool, which internally
  dispatches to `gpt-image-2`.
- The tool supports `action: "auto" | "generate" | "edit"` — use `"edit"` when an image is in context and you want to
  modify it.

> Source: [Image generation guide](https://platform.openai.com/docs/guides/image-generation),
> [Models page](https://platform.openai.com/docs/models),
> [GPT Image prompting cookbook](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide)

### DALL-E

DALL·E 2 is only mentioned in the context of the legacy **variations** endpoint. All current image generation
documentation focuses on `gpt-image-*` models. DALL-E should **not** be considered for new work.

> Source: [Image generation guide](https://platform.openai.com/docs/guides/image-generation)

### Recommended model for 135ify

`gpt-image-2` via the **Image API** (`openai.images.generate`) for single-shot generation/editing, or `gpt-5.6` via the
**Responses API** (`openai.responses.create` with `image_generation` tool) if you need multi-turn conversational
editing. The 135ify ADR 0007 already specifies GPT-4o — this should be updated to `gpt-image-2` for image-to-image work
since GPT-4o is primarily a vision/chat model and `gpt-image-2` is the purpose-built image generation model.

---

## 2. Sending images to the API

### Input methods

Three methods are supported:

1. **Fully qualified URL** — pass a publicly accessible image URL.
2. **Base64-encoded data URI** — `data:image/jpeg;base64,<base64_string>` or `data:image/png;base64,<base64_string>`.
3. **File ID** — upload via the [Files API](https://platform.openai.com/docs/api-reference/files), then reference by ID.

> Source: [Images and vision guide](https://platform.openai.com/docs/guides/images-vision)

### Supported formats

PNG (`image/png`) and JPEG (`image/jpeg`) are explicitly documented in code examples. WebP is not mentioned but may work
given general web image support.

> Source: Code examples in [Images and vision guide](https://platform.openai.com/docs/guides/images-vision) show
> `data:image/jpeg;base64,...` and `image/png`

### Size / resolution limits

For the Chat Completions / Responses API (vision input), images count as tokens based on their resolution and detail
setting. No explicit pixel dimension limit is stated for input images, but
[images count as tokens and are billed accordingly](https://platform.openai.com/docs/guides/images-vision#calculating-costs).

For `gpt-image-2` output resolution constraints:

- Max edge length: < 3840px
- Both edges must be multiples of 16
- Aspect ratio between long edge and short edge must not exceed 3:1
- Total pixels: 655,360 to 8,294,400
- Recommended upper reliability boundary: 2560x1440 (2K/QHD)

> Source:
> [GPT Image prompting cookbook](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide)

### Including images in API calls

**Image API (edit endpoint)** — pass image as a file buffer:

```typescript
import fs from "fs";
import OpenAI from "openai";
const openai = new OpenAI();

const result = await openai.images.edit({
  model: "gpt-image-2",
  image: fs.createReadStream("input.png"),
  prompt: "Add 35mm film grain",
  size: "1024x1536",
});
```

> Source: [Image generation guide — Edit an image](https://platform.openai.com/docs/guides/image-generation)

**Responses API (vision + generation)** — pass image as base64 data URI or URL in the input:

```typescript
const response = await openai.responses.create({
  model: "gpt-5.6",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: "Add realistic 35mm film grain" },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64Image}`,
        },
      ],
    },
  ],
  tools: [{ type: "image_generation" }],
});
```

> Source: [Images and vision guide — Responses API section](https://platform.openai.com/docs/guides/images-vision)

---

## 3. Receiving images from the API

### Image API response format

Generated images are returned as **base64-encoded PNGs** in the `b64_json` field:

```typescript
const result = await openai.images.generate({
  model: "gpt-image-2",
  prompt: "...",
  response_format: "b64_json", // default
});

const imageBase64 = result.data[0].b64_json;
const imageBuffer = Buffer.from(imageBase64, "base64");
fs.writeFileSync("output.png", imageBuffer);
```

The response also supports `response_format: "url"` which returns a temporary URL instead.

> Source: [Image generation guide — Generate Images](https://platform.openai.com/docs/guides/image-generation)

### Responses API response format

Filter the `output` array for items with `type === "image_generation_call"`, then read `result`:

```typescript
const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result); // base64 string

if (imageData.length > 0) {
  const buffer = Buffer.from(imageData[0], "base64");
  fs.writeFileSync("output.png", buffer);
}
```

> Source: [Images and vision guide — Generate or edit images](https://platform.openai.com/docs/guides/images-vision),
> [Image generation guide](https://platform.openai.com/docs/guides/image-generation)

### Format

Always **PNG** (base64-encoded PNG) unless `response_format` is set to `"url"`.

---

## 4. Prompt engineering for film grain

### General prompting principles (from official cookbook)

The [GPT Image prompting cookbook](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide)
recommends:

1. **Structure + goal**: Write prompts in a consistent order — background/scene → subject → key details → constraints.
   Include the intended use to set the "mode" and level of polish.
2. **Specificity + quality cues**: Be concrete about materials, shapes, textures, and the visual medium. Add targeted
   "quality levers" like **"film grain"** (explicitly cited in the cookbook), "textured brushstrokes", "macro detail".
3. **For photorealism**: Include the word **"photorealistic"** directly. Similar phrases like "real photograph", "taken
   on a real camera", "professional photography", "iPhone photo" also help. Detailed camera specs (lens type, aperture)
   are interpreted loosely — use them for look and composition, not exact simulation.
4. **Constraints**: State what must NOT change (e.g., "preserve identity/geometry/layout"). For edits, use "change only
   X" + "keep everything else the same".
5. **For edits**: Reference the input image clearly. For style transfer: "apply Image 2's style to Image 1."

### System prompt vs user prompt

In the Chat Completions API, use `developer` role for system-level instructions and `user` role for the specific
request. The `developer` role has higher priority than `user`:

```typescript
messages: [
  {
    role: "developer",
    content: "You are a photo editor specializing in analog film aesthetics...",
  },
  {
    role: "user",
    content: [
      { type: "text", text: "Add 35mm film grain to this photo" },
      { type: "image_url", image_url: { url: "data:image/png;base64,..." } },
    ],
  },
];
```

In the Responses API, use the `instructions` parameter for the developer-level instructions:

```typescript
const response = await openai.responses.create({
  model: "gpt-5.6",
  instructions: "You are a photo editor specializing in analog film aesthetics...",
  input: "...",
  tools: [{ type: "image_generation" }],
});
```

> Source:
> [Prompt engineering guide — Message roles and instruction following](https://platform.openai.com/docs/guides/prompt-engineering),
> [OpenAI Model Spec — Chain of Command](https://model-spec.openai.com/2025-02-12.html#chain_of_command)

### Recommended prompt for film grain

Based on the cookbook's principles, a prompt for adding 135 film grain would look like:

```
Apply natural 35mm analog film grain to this image.
Photorealistic film texture with realistic grain clumping, subtle tonal variation,
and organic directionality. Preserve all original image details, colors, and composition.
No heavy retouching, no artificial sharpening, no watermark.
```

Optionally add photo-specific cues for stronger stylization:

- `"Shot on Kodak Portra 400 pushed +1 stop"`
- `"35mm film scan, subtle grain, natural color balance"`
- `"ISO 800 film grain structure"`

> Source: Prompt structure derived from
> [GPT Image prompting cookbook — Prompting Fundamentals](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide)

---

## 5. Node.js client

### Installation

```bash
npm install openai
```

The SDK automatically reads `OPENAI_API_KEY` from the environment.

> Source: [SDKs and CLI](https://platform.openai.com/docs/libraries)

### Image API — generate (text-to-image)

```typescript
import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

const result = await openai.images.generate({
  model: "gpt-image-2",
  prompt: "A children's book drawing of a veterinarian...",
  quality: "medium", // "low" | "medium" | "high"
  size: "1024x1536",
  n: 1, // number of images (default 1)
});

const imageBase64 = result.data[0].b64_json;
fs.writeFileSync("output.png", Buffer.from(imageBase64, "base64"));
```

> Source: [Image generation guide](https://platform.openai.com/docs/guides/image-generation)

### Image API — edit (image-to-image)

```typescript
const result = await openai.images.edit({
  model: "gpt-image-2",
  image: fs.createReadStream("input.png"),
  prompt: "Add 35mm film grain texture",
  quality: "medium",
  size: "1024x1536",
});

const imageBase64 = result.data[0].b64_json;
fs.writeFileSync("output.png", Buffer.from(imageBase64, "base64"));
```

> Source: [Image API reference — Edit an image](https://platform.openai.com/docs/api-reference/images/create-edit)

### Responses API — image generation as a tool

```typescript
const response = await openai.responses.create({
  model: "gpt-5.6",
  input: "Generate an image of a cat hugging an otter",
  tools: [{ type: "image_generation" }],
});

const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  fs.writeFileSync("output.png", Buffer.from(imageData[0], "base64"));
}
```

> Source: [Images and vision guide — Generate or edit images](https://platform.openai.com/docs/guides/images-vision)

### Responses API — multi-turn editing with previous response

```typescript
// First turn: generate
const response1 = await openai.responses.create({
  model: "gpt-5.6",
  input: "Add film grain to this photo",
  tools: [{ type: "image_generation" }],
});

// Second turn: refine using previous_response_id
const response2 = await openai.responses.create({
  model: "gpt-5.6",
  previous_response_id: response1.id,
  input: "Make the grain more subtle, like Kodak Portra 160",
  tools: [{ type: "image_generation" }],
});
```

> Source:
> [Image generation guide — Multi-turn image generation](https://platform.openai.com/docs/guides/image-generation)

### Key parameters summary

| Parameter         | Values                                                 | Notes                                                     |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `model`           | `gpt-image-2` (Image API) or `gpt-5.6` (Responses API) |                                                           |
| `quality`         | `low`, `medium`, `high`                                | `low` is fast/cost-efficient; `high` for maximum fidelity |
| `size`            | `1024x1024`, `1024x1536`, `1536x1024`                  | For `gpt-image-1.5`/`gpt-image-1`/`gpt-image-1-mini`      |
| `size`            | Arbitrary within constraints                           | For `gpt-image-2` (see size limits above)                 |
| `n`               | 1–?                                                    | Number of images to generate                              |
| `response_format` | `b64_json` (default), `url`                            |                                                           |

> Source: [Image generation guide](https://platform.openai.com/docs/guides/image-generation),
> [GPT Image prompting cookbook](https://cookbook.openai.com/examples/multimodal/image-gen-models-prompting-guide)

---

## Recommendations for 135ify

1. **Use `gpt-image-2`** via the Image API `images.edit` endpoint for image-to-image film grain application. This is the
   most direct path — send a source image + prompt, get a transformed image back.

2. **Send the source image as a file stream** (from Convex FileStorage) via
   `openai.images.edit({ image: readStream, ... })`.

3. **Use a concise, photography-aware prompt** following the cookbook conventions: description of the film stock/ISO,
   grain characteristics, preservation constraints.

4. **Store the result** as base64 → Convex FileStorage (matching the existing AI Take pattern from ADR 0007).

5. **Update ADR 0007** to reference `gpt-image-2` instead of `gpt-4o` for the image generation model — GPT-4o is a
   vision/chat model while `gpt-image-2` is purpose-built for image generation and editing.
