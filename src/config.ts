export const BASE_PATH =
  import.meta.env.VITE_BASE_PATH === "/" ? "" : (import.meta.env.VITE_BASE_PATH ?? "");
export const FEATURE_AI_GRAIN = import.meta.env.VITE_FEATURE_AI_GRAIN === "true";
export const FEATURE_SIGN_IN = import.meta.env.VITE_FEATURE_SIGN_IN === "true";
export const FEATURE_SUBSCRIPTIONS = import.meta.env.VITE_FEATURE_SUBSCRIPTIONS === "true";
export const FILE_SIZE_LIMIT_BYTES =
  (Number(import.meta.env.VITE_FILE_SIZE_LIMIT_MB) || 5) * 1024 * 1024;
export const GRAIN_URL = `${import.meta.env.BASE_URL}grain.jpg`;

const stripeStoragePriceId = import.meta.env.VITE_STRIPE_STORAGE_PRICE_ID ?? "";
const stripeAiPriceId = import.meta.env.VITE_STRIPE_AI_PRICE_ID ?? "";

if (FEATURE_SUBSCRIPTIONS && (!stripeStoragePriceId || !stripeAiPriceId)) {
  throw new Error(
    "FEATURE_SUBSCRIPTIONS enabled but VITE_STRIPE_STORAGE_PRICE_ID or VITE_STRIPE_AI_PRICE_ID is not set",
  );
}

export type ProductKey = "storage_paid" | "ai_generation_platform";

export interface Plan {
  key: ProductKey;
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
}

export const PLANS: Plan[] = [
  {
    key: "storage_paid",
    name: "Storage",
    price: "$2/mo",
    description: "More gallery space for your 135 scans.",
    features: ["360 images (up from 36)", "25 MB per file (up from 10 MB)", "~9 GB total storage"],
    priceId: stripeStoragePriceId,
  },
  {
    key: "ai_generation_platform",
    name: "AI Generation",
    price: "$2/mo",
    description: "Platform-managed AI grain. No BYO key needed.",
    features: [
      "OpenAI-powered film grain generation",
      "No separate API key required",
      "Managed monthly usage allowance",
    ],
    priceId: stripeAiPriceId,
  },
];

export function getPlan(key: string): Plan | undefined {
  return PLANS.find((p) => p.key === key);
}
