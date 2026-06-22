import { prepareFiles } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@config", () => ({
  FILE_SIZE_LIMIT_BYTES: 100,
}));

const makeImage = (name = "photo.jpg", size = 50) =>
  new File([new Uint8Array(size)], name, { type: "image/jpeg" });

const makeText = (name = "doc.txt") => new File(["hello"], name, { type: "text/plain" });

const makeOversized = (name = "big.jpg") =>
  new File([new Uint8Array(200)], name, { type: "image/jpeg" });

function expectRejected(file: File, errorFragment: string) {
  const { valid, errors } = prepareFiles([file]);
  expect(valid).toEqual([]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain(errorFragment);
  return errors;
}

describe("prepareFiles", () => {
  it("returns empty arrays for empty input", () => {
    const result = prepareFiles([]);
    expect(result.valid).toEqual([]);
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("accepts a valid image file", () => {
    const file = makeImage();
    const { valid, records, errors } = prepareFiles([file]);

    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toBe(file);
    expect(records).toHaveLength(1);
    expect(records[0].fileName).toBe("photo.jpg");
  });

  it("rejects a file exceeding the size limit", () => {
    const [error] = expectRejected(makeOversized(), "big.jpg");
    expect(error).toContain("exceeds the maximum size");
  });

  it("rejects a non-image file", () => {
    const [error] = expectRejected(makeText(), "doc.txt");
    expect(error).toContain("not an accepted file type");
  });

  it("splits mixed valid and invalid files", () => {
    const image = makeImage("ok.jpg");
    const oversized = makeOversized("big.jpg");
    const text = makeText("nope.txt");

    const { valid, records, errors } = prepareFiles([image, oversized, text]);

    expect(valid).toHaveLength(1);
    expect(valid[0]).toBe(image);
    expect(records).toHaveLength(1);
    expect(errors).toHaveLength(2);
  });

  it("accepts a file at exactly the size limit", () => {
    const file = new File([new Uint8Array(100)], "exact.jpg", {
      type: "image/jpeg",
    });
    const { valid, errors } = prepareFiles([file]);

    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
  });

  it("rejects a file one byte over the size limit", () => {
    const file = new File([new Uint8Array(101)], "over.jpg", {
      type: "image/jpeg",
    });
    const { valid, errors } = prepareFiles([file]);

    expect(valid).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("assigns unique incrementing IDs", () => {
    const a = makeImage("a.jpg");
    const b = makeImage("b.jpg");
    const { records } = prepareFiles([a, b]);

    expect(records[0].id).toMatch(/^a\.jpg-\d+$/);
    expect(records[1].id).toMatch(/^b\.jpg-\d+$/);
    expect(records[0].id).not.toBe(records[1].id);
  });

  it("increments IDs across separate calls", () => {
    const f1 = makeImage("x.jpg");
    const r1 = prepareFiles([f1]);
    const r2 = prepareFiles([f1]);

    expect(r2.records[0].id).not.toBe(r1.records[0].id);
  });

  it("creates a sourceUrl object URL", () => {
    const { records } = prepareFiles([makeImage()]);
    expect(typeof records[0].sourceUrl).toBe("string");
    expect(records[0].sourceUrl).toMatch(/^blob:/);
  });

  it("spreads default params into each file", () => {
    const { records } = prepareFiles([makeImage()]);
    expect(records[0].params).toEqual(DEFAULT_PARAMS);
  });

  it("returns a new params object per file (not shared reference)", () => {
    const { records } = prepareFiles([makeImage(), makeImage()]);
    expect(records[0].params).not.toBe(records[1].params);
  });
});
