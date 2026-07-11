import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("applyHalation", () => {
  let applyHalation: typeof import("./apply-halation").applyHalation;
  let outerCtx: ReturnType<typeof makeCtxMock>;
  let innerCtx: ReturnType<typeof makeCtxMock>;

  function makeCtxMock() {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      filter: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      canvas: { width: 100, height: 80 },
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
        width = 100;
        height = 80;
        convertToBlob = vi.fn();
      },
    );

    ({ applyHalation } = await import("./apply-halation"));
    outerCtx = makeCtxMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns early when halationIntensity is 0", () => {
    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 0,
      halationThreshold: 50,
      halationSpread: 50,
    });

    expect(outerCtx.drawImage).not.toHaveBeenCalled();
    expect(outerCtx.globalCompositeOperation).toBe("source-over");
  });

  it("copies source canvas to mask canvas", () => {
    const imageData = {
      data: new Uint8ClampedArray(100 * 80 * 4),
      width: 100,
      height: 80,
    };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 10,
    });

    expect(innerCtx.drawImage).toHaveBeenCalledWith(outerCtx.canvas, 0, 0);
  });

  it("reads pixels from the mask canvas", () => {
    const imageData = {
      data: new Uint8ClampedArray(100 * 80 * 4),
      width: 100,
      height: 80,
    };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 10,
    });

    expect(innerCtx.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
  });

  it("sets alpha to 0 for pixels below brightness threshold", () => {
    const pixels = new Uint8ClampedArray(100 * 80 * 4);
    const idx = 0;
    pixels[idx] = 100;
    pixels[idx + 1] = 100;
    pixels[idx + 2] = 100;
    pixels[idx + 3] = 255;
    const imageData = { data: pixels, width: 100, height: 80 };
    innerCtx.getImageData.mockReturnValue(imageData);
    innerCtx.putImageData = vi.fn();

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 10,
    });

    expect(innerCtx.putImageData).toHaveBeenCalled();
    const putCallData = (innerCtx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray })
      .data;
    expect(putCallData[3]).toBe(0);
  });

  it("tints bright pixels with warm color", () => {
    const pixels = new Uint8ClampedArray(100 * 80 * 4);
    const idx = 0;
    pixels[idx] = 200;
    pixels[idx + 1] = 200;
    pixels[idx + 2] = 200;
    pixels[idx + 3] = 255;
    const imageData = { data: pixels, width: 100, height: 80 };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 10,
      halationSpread: 10,
    });

    const putCall = innerCtx.putImageData.mock.calls.find(() => true);
    expect(putCall).toBeDefined();
  });

  it("applies blur filter to the mask", () => {
    const imageData = {
      data: new Uint8ClampedArray(100 * 80 * 4),
      width: 100,
      height: 80,
    };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 50,
    });

    expect(innerCtx.filter).toBe("none");
  });

  it("draws blurred mask onto main canvas with screen blend", () => {
    const imageData = {
      data: new Uint8ClampedArray(100 * 80 * 4),
      width: 100,
      height: 80,
    };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 10,
    });

    expect(outerCtx.drawImage).toHaveBeenCalled();
  });

  it("restores globalAlpha and compositeOperation after processing", () => {
    const imageData = {
      data: new Uint8ClampedArray(100 * 80 * 4),
      width: 100,
      height: 80,
    };
    innerCtx.getImageData.mockReturnValue(imageData);

    applyHalation(outerCtx as unknown as OffscreenCanvasRenderingContext2D, 100, 80, {
      ...DEFAULT_PARAMS,
      halationIntensity: 100,
      halationThreshold: 50,
      halationSpread: 10,
    });

    expect(outerCtx.globalAlpha).toBe(1);
    expect(outerCtx.globalCompositeOperation).toBe("source-over");
  });
});
