import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { describe, expect, it } from "vite-plus/test";

import type { ConvexImageDoc } from "./convex-hydration";

import { hydrateFromConvex } from "./convex-hydration";

const makeDoc = (overrides: Partial<ConvexImageDoc> = {}): ConvexImageDoc => ({
  _id: "img123" as ConvexImageDoc["_id"],
  _creationTime: 1000,
  userId: "user1" as ConvexImageDoc["userId"],
  sourceStorageId: "storage1" as ConvexImageDoc["sourceStorageId"],
  fileName: "photo.jpg",
  sourceUrl: "https://convex.cloud/file.jpg",
  params: {
    selectedFilmId: "none",
    halationIntensity: 0,
    halationSpread: 0,
    halationThreshold: 0,
    vignetteIntensity: 0,
    vignetteFeather: 0,
    grainIntensity: 0,
  },
  ...overrides,
});

const makeExisting = (overrides: Partial<FileRecord> = {}): FileRecord => ({
  id: "img123",
  fileName: "photo.jpg",
  sourceUrl: "blob:preview",
  params: { ...DEFAULT_PARAMS },
  createdAt: 1000,
  renderUrl: null,
  isProcessing: false,
  renderError: null,
  ...overrides,
});

describe("hydrateFromConvex", () => {
  it("maps Convex docs to FileRecords", () => {
    const docs = [makeDoc()];
    const records = hydrateFromConvex(docs, []);

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe("img123");
    expect(records[0].fileName).toBe("photo.jpg");
    expect(records[0].sourceUrl).toBe("https://convex.cloud/file.jpg");
    expect(records[0].createdAt).toBe(1000);
  });

  it("maps params including selectedFilmId", () => {
    const docs = [makeDoc({ params: { ...makeDoc().params, selectedFilmId: "gold" } })];
    const records = hydrateFromConvex(docs, []);

    expect(records[0].params.selectedFilmId).toBe("gold");
  });

  it("preserves existing client-side renderUrl", () => {
    const existing = [makeExisting({ id: "img123", renderUrl: "blob:rendered" })];
    const records = hydrateFromConvex([makeDoc()], existing);

    expect(records[0].renderUrl).toBe("blob:rendered");
    expect(records[0].isProcessing).toBe(false);
    expect(records[0].renderError).toBeNull();
  });

  it("preserves existing client-side isProcessing and renderError", () => {
    const existing = [
      makeExisting({
        id: "img123",
        renderUrl: null,
        isProcessing: true,
        renderError: null,
      }),
    ];
    const records = hydrateFromConvex([makeDoc()], existing);

    expect(records[0].renderUrl).toBeNull();
    expect(records[0].isProcessing).toBe(true);
    expect(records[0].renderError).toBeNull();
  });

  it("uses null defaults when no existing file matches", () => {
    const records = hydrateFromConvex([makeDoc()], []);

    expect(records[0].renderUrl).toBeNull();
    expect(records[0].isProcessing).toBe(false);
    expect(records[0].renderError).toBeNull();
  });

  it("handles missing sourceUrl", () => {
    const docs = [makeDoc({ sourceUrl: null })];
    const records = hydrateFromConvex(docs, []);

    expect(records[0].sourceUrl).toBe("");
  });

  it("maps multiple docs", () => {
    const docs = [
      makeDoc({ _id: "a" as ConvexImageDoc["_id"], fileName: "a.jpg" }),
      makeDoc({ _id: "b" as ConvexImageDoc["_id"], fileName: "b.jpg" }),
    ];
    const records = hydrateFromConvex(docs, []);

    expect(records).toHaveLength(2);
    expect(records[0].id).toBe("a");
    expect(records[1].id).toBe("b");
  });

  it("only preserves state for matching existing files", () => {
    const existing = [makeExisting({ id: "a", renderUrl: "blob:a" })];
    const docs = [
      makeDoc({ _id: "a" as ConvexImageDoc["_id"] }),
      makeDoc({ _id: "b" as ConvexImageDoc["_id"] }),
    ];
    const records = hydrateFromConvex(docs, existing);

    expect(records[0].renderUrl).toBe("blob:a");
    expect(records[1].renderUrl).toBeNull();
  });
});
