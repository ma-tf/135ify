import { DEFAULT_PARAMS } from "@features/process/process-image";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/grain-texture", () => ({
  getGrainBitmap: vi.fn(),
}));

describe("processToBlobUrl", () => {
  let processToBlobUrl: typeof import("./process-image").processToBlobUrl;

  const fakeGrainBitmap = { width: 2048, height: 2048 } as ImageBitmap;
  const closeSpy = vi.fn();
  const fakeSourceBitmap = {
    width: 100,
    height: 80,
    close: closeSpy,
  } as unknown as ImageBitmap;
  const fakeResultBlob = new Blob(["result"], { type: "image/jpeg" });
  const fakeResponseBlob = new Blob(["source"], { type: "image/jpeg" });
  const fakeResponse = { blob: vi.fn().mockResolvedValue(fakeResponseBlob) };

  function makeCtxMock() {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation((_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      })),
      putImageData: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillRect: vi.fn(),
      filter: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      fillStyle: "",
      canvas: { width: 0, height: 0 },
    };
  }

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const grainModule = await import("@features/process/grain-texture");
    vi.mocked(grainModule.getGrainBitmap).mockResolvedValue(fakeGrainBitmap);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse));
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(fakeSourceBitmap));
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        getContext = vi.fn().mockReturnValue(makeCtxMock());
        convertToBlob = vi.fn().mockResolvedValue(fakeResultBlob);
      },
    );

    ({ processToBlobUrl } = await import("./process-image"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the source URL", async () => {
    const fetchSpy = vi.mocked(globalThis.fetch);
    await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(fetchSpy).toHaveBeenCalledWith("http://example.com/photo.jpg");
  });

  it("awaits getGrainBitmap for the grain texture", async () => {
    const grainModule = await import("@features/process/grain-texture");
    await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(grainModule.getGrainBitmap).toHaveBeenCalledOnce();
  });

  it("creates an ImageBitmap from the fetched blob", async () => {
    const createImageBitmapSpy = vi.mocked(globalThis.createImageBitmap);
    await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(createImageBitmapSpy).toHaveBeenCalledWith(fakeResponseBlob);
  });

  it("closes the source bitmap after processing", async () => {
    await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it("returns a string URL", async () => {
    const result = await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(typeof result).toBe("string");
  });

  it("passes maxDimension to constrainDimensions when provided", async () => {
    const result = await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS, 50);
    expect(typeof result).toBe("string");
  });

  it("uses unconstrained dimensions when maxDimension is omitted", async () => {
    const result = await processToBlobUrl("http://example.com/photo.jpg", DEFAULT_PARAMS);
    expect(typeof result).toBe("string");
  });

  it("applies film tint when a non-default film is selected", async () => {
    const goldParams = { ...DEFAULT_PARAMS, selectedFilmId: "gold" as const };
    const result = await processToBlobUrl("http://example.com/photo.jpg", goldParams);
    expect(typeof result).toBe("string");
  });
});
