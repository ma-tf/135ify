// https://developers.openai.com/api/docs/guides/images-vision#calculating-costs
// TODO: calculate in greater detail later; placeholder rates are sufficient for now
const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "gpt-5.6-luna": { inputPerMillion: 100, outputPerMillion: 600 },
  "gpt-5.4": { inputPerMillion: 500, outputPerMillion: 1500 },
  "gpt-5.4-mini": { inputPerMillion: 500, outputPerMillion: 1500 },
};

const FALLBACK_PRICING = { inputPerMillion: 500, outputPerMillion: 1500 };

export function calculateCostCents(
  inputTokens: number,
  outputTokens: number,
  model: string,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.error(`calculateCostCents: unknown model "${model}" — using fallback pricing`);
  }
  const { inputPerMillion, outputPerMillion } = pricing ?? FALLBACK_PRICING;
  return Math.ceil((inputTokens * inputPerMillion + outputTokens * outputPerMillion) / 1_000_000);
}
