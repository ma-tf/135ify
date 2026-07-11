import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("applyGrain", () => {
  let applyGrain: typeof import("./apply-grain").applyGrain;
  let outerCtx: ReturnType<typeof makeCtxMock>;
  let innerCtx: ReturnType<typeof makeCtxMock>;

  function makeCtxMock() {
    return {
      drawImage: vi.fn(),
      filter: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
    };
  }

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    innerCtx = makeCtxMock();
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        getContext = vi.fn(() => innerCtx);
        width = 0;
        height = 0;
        convertToBlob = vi.fn();
      },
    );

    ({ applyGrain } = await import("./apply-grain"));
    outerCtx = makeCtxMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns early when grainIntensity is 0", () => {
    applyGrain(
      outerCtx as unknown as OffscreenCanvasRenderingContext2D,
      100,
      80,
      100,
      80,
      {} as ImageBitmap,
      { ...DEFAULT_PARAMS, grainIntensity: 0 },
    );
    expect(outerCtx.drawImage).not.toHaveBeenCalled();
    expect(outerCtx.globalCompositeOperation).toBe("source-over");
  });

  it("draws grain centred when source fits within grain texture", () => {
    const grain = { width: 200, height: 160 } as ImageBitmap;
    applyGrain(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, 100, 80, grain, {
      ...DEFAULT_PARAMS,
      grainIntensity: 50,
    });

    expect(innerCtx.drawImage).toHaveBeenCalledWith(grain, 50, 40, 100, 80, 0, 0, 100, 80);
    expect(outerCtx.drawImage).toHaveBeenCalledTimes(1);
  });

  it("scales grain when source exceeds grain texture", () => {
    const grain = { width: 100, height: 80 } as ImageBitmap;
    applyGrain(
      outerCtx as unknown as OffscreenCanvasRenderingContext2D,
      200,
      160,
      200,
      160,
      grain,
      { ...DEFAULT_PARAMS, grainIntensity: 50 },
    );

    const calls = innerCtx.drawImage.mock.calls;
    const grainCall = calls.find((c: unknown[]) => c[0] === grain);
    expect(grainCall).toBeDefined();
    const [, , , , , , , dw, dh] = grainCall as number[];
    expect(dw).toBeGreaterThan(grain.width);
    expect(dh).toBeGreaterThan(grain.height);
  });

  it("sets saturate(0) filter before drawing grain canvas", () => {
    const grain = { width: 200, height: 160 } as ImageBitmap;
    applyGrain(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, 100, 80, grain, {
      ...DEFAULT_PARAMS,
      grainIntensity: 50,
    });

    const drawCalls = innerCtx.drawImage.mock.calls;
    drawCalls.forEach((_call: unknown[]) => {
      const src = (_call as unknown[])[0];
      if (src === grain) {
        expect(innerCtx.filter).toBe("none");
      }
    });
  });

  it("composites grain canvas with screen operation and correct alpha", () => {
    const grain = { width: 200, height: 160 } as ImageBitmap;
    applyGrain(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, 100, 80, grain, {
      ...DEFAULT_PARAMS,
      grainIntensity: 75,
    });

    expect(outerCtx.drawImage).toHaveBeenCalled();
  });

  it("restores globalCompositeOperation and alpha after processing", () => {
    const grain = { width: 200, height: 160 } as ImageBitmap;
    applyGrain(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, 100, 80, grain, {
      ...DEFAULT_PARAMS,
      grainIntensity: 75,
    });

    expect(outerCtx.globalCompositeOperation).toBe("source-over");
    expect(outerCtx.globalAlpha).toBe(1);
  });

  it("applies grain with full intensity", () => {
    const grain = { width: 200, height: 160 } as ImageBitmap;
    applyGrain(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, 100, 80, grain, {
      ...DEFAULT_PARAMS,
      grainIntensity: 100,
    });

    expect(outerCtx.drawImage).toHaveBeenCalled();
  });
});
