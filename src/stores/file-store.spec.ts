import type { FileRecord } from "@stores/file-store-types";

import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { prepareFiles } from "@stores/prepare-files";
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

  it("initializes render state fields to null/false", () => {
    const { records } = prepareFiles([makeImage()]);
    expect(records[0].renderUrl).toBeNull();
    expect(records[0].isProcessing).toBe(false);
    expect(records[0].renderError).toBeNull();
  });
});

describe("useFileStore updateFile", () => {
  const makeFile = (overrides: Partial<FileRecord> = {}): FileRecord => ({
    id: "f1",
    fileName: "test.jpg",
    sourceUrl: "blob:src",
    params: { ...DEFAULT_PARAMS },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  });

  it("sets a single field", () => {
    useFileStore.setState({ files: [makeFile()] });
    useFileStore.getState().updateFile("f1", { renderUrl: "blob:rendered" });
    expect(useFileStore.getState().files[0].renderUrl).toBe("blob:rendered");
  });

  it("sets multiple fields at once", () => {
    useFileStore.setState({ files: [makeFile()] });
    useFileStore.getState().updateFile("f1", {
      renderUrl: "blob:rendered",
      isProcessing: true,
      renderError: null,
    });
    const f = useFileStore.getState().files[0];
    expect(f.renderUrl).toBe("blob:rendered");
    expect(f.isProcessing).toBe(true);
    expect(f.renderError).toBeNull();
  });

  it("does not update non-matching files", () => {
    useFileStore.setState({ files: [makeFile({ id: "f1" }), makeFile({ id: "f2" })] });
    useFileStore.getState().updateFile("f1", { renderUrl: "blob:rendered" });
    const files = useFileStore.getState().files;
    expect(files[0].renderUrl).toBe("blob:rendered");
    expect(files[1].renderUrl).toBeNull();
  });

  it("is a no-op when the id does not exist", () => {
    useFileStore.setState({ files: [makeFile()] });
    useFileStore.getState().updateFile("nonexistent", { renderUrl: "blob:rendered" });
    expect(useFileStore.getState().files[0].renderUrl).toBeNull();
  });

  it("hydrateFiles replaces all files", () => {
    useFileStore.setState({ files: [] });
    const record = {
      id: "h1",
      fileName: "hydrated.jpg",
      sourceUrl: "blob:src",
      params: { ...DEFAULT_PARAMS },
      convexId: null,
      createdAt: 0,
      renderUrl: null,
      isProcessing: false,
      renderError: null,
    };
    useFileStore.getState().hydrateFiles([record]);
    expect(useFileStore.getState().files).toEqual([record]);
  });
});

describe("useFileStore addFiles", () => {
  const makeFile = (id: string, overrides: Partial<FileRecord> = {}): FileRecord => ({
    id,
    fileName: `${id}.jpg`,
    sourceUrl: "blob:src",
    params: { ...DEFAULT_PARAMS },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  });

  it("adds files to an empty store", () => {
    useFileStore.setState({ files: [] });
    const [a] = [makeFile("a")];
    useFileStore.getState().addFiles([a]);
    expect(useFileStore.getState().files).toHaveLength(1);
    expect(useFileStore.getState().files[0].id).toBe("a");
  });

  it("prepends files to existing state", () => {
    useFileStore.setState({ files: [makeFile("a")] });
    useFileStore.getState().addFiles([makeFile("b")]);
    const files = useFileStore.getState().files;
    expect(files).toHaveLength(2);
    expect(files[0].id).toBe("b");
    expect(files[1].id).toBe("a");
  });

  it("handles multiple files at once", () => {
    useFileStore.setState({ files: [] });
    useFileStore.getState().addFiles([makeFile("a"), makeFile("b")]);
    expect(useFileStore.getState().files).toHaveLength(2);
  });
});

describe("useFileStore updateParams", () => {
  const makeFile = (id: string, overrides: Partial<FileRecord> = {}): FileRecord => ({
    id,
    fileName: `${id}.jpg`,
    sourceUrl: "blob:src",
    params: { ...DEFAULT_PARAMS },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  });

  it("updates a single param field", () => {
    useFileStore.setState({ files: [makeFile("f1")] });
    useFileStore.getState().updateParams("f1", { grainIntensity: 50 });
    expect(useFileStore.getState().files[0].params.grainIntensity).toBe(50);
  });

  it("merges partial params without affecting other fields", () => {
    useFileStore.setState({ files: [makeFile("f1")] });
    useFileStore.getState().updateParams("f1", { grainIntensity: 50 });
    expect(useFileStore.getState().files[0].params.vignetteIntensity).toBe(0);
  });

  it("does not affect other files", () => {
    useFileStore.setState({ files: [makeFile("a"), makeFile("b")] });
    useFileStore.getState().updateParams("a", { grainIntensity: 50 });
    const files = useFileStore.getState().files;
    expect(files[0].params.grainIntensity).toBe(50);
    expect(files[1].params.grainIntensity).toBe(0);
  });
});

describe("useFileStore removeFile", () => {
  const makeFile = (id: string, overrides: Partial<FileRecord> = {}): FileRecord => ({
    id,
    fileName: `${id}.jpg`,
    sourceUrl: "blob:src",
    params: { ...DEFAULT_PARAMS },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  });

  it("removes a file by id", () => {
    useFileStore.setState({ files: [makeFile("a"), makeFile("b")] });
    useFileStore.getState().removeFile("a");
    expect(useFileStore.getState().files).toHaveLength(1);
    expect(useFileStore.getState().files[0].id).toBe("b");
  });

  it("is a no-op for unknown id", () => {
    useFileStore.setState({ files: [makeFile("a")] });
    useFileStore.getState().removeFile("nope");
    expect(useFileStore.getState().files).toHaveLength(1);
  });

  it("leaves the store empty when removing the last file", () => {
    useFileStore.setState({ files: [makeFile("a")] });
    useFileStore.getState().removeFile("a");
    expect(useFileStore.getState().files).toEqual([]);
  });
});

describe("useFileStore clearFiles", () => {
  const makeFile = (id: string, overrides: Partial<FileRecord> = {}): FileRecord => ({
    id,
    fileName: `${id}.jpg`,
    sourceUrl: "blob:src",
    params: { ...DEFAULT_PARAMS },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: null,
    isProcessing: false,
    renderError: null,
    ...overrides,
  });

  it("clears all files from the store", () => {
    useFileStore.setState({ files: [makeFile("a"), makeFile("b")] });
    useFileStore.getState().clearFiles();
    expect(useFileStore.getState().files).toEqual([]);
  });

  it("is a no-op on an already empty store", () => {
    useFileStore.setState({ files: [] });
    useFileStore.getState().clearFiles();
    expect(useFileStore.getState().files).toEqual([]);
  });
});
