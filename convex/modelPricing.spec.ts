import { describe, expect, it } from "vite-plus/test";

import { calculateCostCents } from "./modelPricing";

describe("calculateCostCents", () => {
  it("calculates cost for gpt-5.4 at $5/1M input, $15/1M output", () => {
    const result = calculateCostCents(1_000_000, 0, "gpt-5.4");
    expect(result).toBe(500);
  });

  it("calculates output tokens cost", () => {
    const result = calculateCostCents(0, 1_000_000, "gpt-5.4");
    expect(result).toBe(1500);
  });

  it("rounds up fractional cents", () => {
    const result = calculateCostCents(1, 0, "gpt-5.4");
    expect(result).toBe(1);
  });

  it("computes zero cost for zero tokens", () => {
    const result = calculateCostCents(0, 0, "gpt-5.4");
    expect(result).toBe(0);
  });

  it("works with realistic token counts", () => {
    const result = calculateCostCents(5000, 1000, "gpt-5.4");
    expect(result).toBe(4);
  });

  it("uses fallback pricing for unknown models", () => {
    const result = calculateCostCents(1_000_000, 0, "some-unknown-model");
    expect(result).toBe(500);
  });
});
