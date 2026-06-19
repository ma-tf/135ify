import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@config", () => ({ GRAIN_URL: "/grain.jpg" }));

describe("getGrainBitmap", () => {
  let getGrainBitmap: typeof import("./grain-texture").getGrainBitmap;

  const fakeBitmap = {} as ImageBitmap;
  const fakeBlob = {} as Blob;
  let fakeResponse: { blob: ReturnType<typeof vi.fn> };
  const fetchSpy = vi.fn();
  const createImageBitmapSpy = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    fakeResponse = { blob: vi.fn().mockResolvedValue(fakeBlob) };
    fetchSpy.mockReset();
    createImageBitmapSpy.mockReset();
    fetchSpy.mockResolvedValue(fakeResponse);
    createImageBitmapSpy.mockResolvedValue(fakeBitmap);
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("createImageBitmap", createImageBitmapSpy);
    ({ getGrainBitmap } = await import("./grain-texture"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches from GRAIN_URL", async () => {
    await getGrainBitmap();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith("/grain.jpg");
  });

  it("converts response to blob then ImageBitmap", async () => {
    await getGrainBitmap();
    expect(fakeResponse.blob).toHaveBeenCalledOnce();
    expect(createImageBitmapSpy).toHaveBeenCalledOnce();
    expect(createImageBitmapSpy).toHaveBeenCalledWith(fakeBlob);
  });

  it("returns the ImageBitmap", async () => {
    const result = await getGrainBitmap();
    expect(result).toBe(fakeBitmap);
  });

  it("caches — second call reuses the same promise", async () => {
    const first = getGrainBitmap();
    const second = getGrainBitmap();
    await Promise.all([first, second]);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("rejects when fetch fails", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network error"));
    await expect(getGrainBitmap()).rejects.toThrow("network error");
  });

  it("rejects when createImageBitmap fails", async () => {
    createImageBitmapSpy.mockRejectedValueOnce(new Error("decode error"));
    await expect(getGrainBitmap()).rejects.toThrow("decode error");
  });
});
