import type { Doc } from "@convex/_generated/dataModel";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

import { useGalleryData } from "./use-gallery-data";

const makeDoc = (overrides: Partial<Doc<"images"> & { sourceUrl: string | null }> = {}) => {
  const doc: Doc<"images"> & { sourceUrl: string | null } = {
    _id: "img-1" as Doc<"images">["_id"],
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    userId: "user1" as Doc<"images">["userId"],
    sourceStorageId: "storage1" as Doc<"images">["sourceStorageId"],
    fileName: "test-photo.jpg",
    sourceUrl: "https://example.com/storage/1",
    params: { ...DEFAULT_PARAMS },
    ...overrides,
  };
  return doc;
};

describe("useGalleryData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGalleryClientStore.setState({ imageCache: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it("returns empty images when query returns no data", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.images).toEqual([]);
    expect(result.current.pendingFiles).toEqual([]);
    expect(result.current.result.status).toBe("success");
  });

  it("maps doc fields into FileRecord", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.images).toHaveLength(1);
    const image = result.current.images[0];
    expect(image.id).toBe(doc._id);
    expect(image.fileName).toBe(doc.fileName);
    expect(image.sourceUrl).toBe(doc.sourceUrl);
    expect(image.params).toEqual(doc.params);
    expect(image.createdAt).toBe(doc._creationTime);
    expect(image.renderUrl).toBeNull();
    expect(image.isProcessing).toBe(false);
    expect(image.renderError).toBeNull();
  });

  it("merges cached renderUrl from store", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    useGalleryClientStore.setState({
      imageCache: {
        [doc._id]: { renderUrl: "blob:rendered", isProcessing: false, renderError: null },
      },
    });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.images[0].renderUrl).toBe("blob:rendered");
  });

  it("merges cached isProcessing from store", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    useGalleryClientStore.setState({
      imageCache: { [doc._id]: { renderUrl: null, isProcessing: true, renderError: null } },
    });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.images[0].isProcessing).toBe(true);
  });

  it("pendingFiles excludes rendered files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    useGalleryClientStore.setState({
      imageCache: { [doc._id]: { renderUrl: "blob:done", isProcessing: false, renderError: null } },
    });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.pendingFiles).toEqual([]);
  });

  it("pendingFiles excludes processing files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    useGalleryClientStore.setState({
      imageCache: { [doc._id]: { renderUrl: null, isProcessing: true, renderError: null } },
    });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.pendingFiles).toEqual([]);
  });

  it("pendingFiles includes unprocessed files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.pendingFiles).toHaveLength(1);
    expect(result.current.pendingFiles[0].id).toBe(doc._id);
  });

  it("storageValue has correct shape", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { result } = renderHook(() => useGalleryData());

    const sv = result.current.storageValue;
    expect(sv.files).toEqual([]);
    expect(typeof sv.addFiles).toBe("function");
    expect(typeof sv.removeFile).toBe("function");
    expect(typeof sv.updateParams).toBe("function");
    expect(typeof sv.updateFile).toBe("function");
    expect(sv.loading).toBe(false);
    expect(sv.error).toBeNull();
  });

  it("updateFile propagates to gallery client store", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { result } = renderHook(() => useGalleryData());

    act(() => {
      result.current.storageValue.updateFile("img-1", { renderUrl: "blob:x" });
    });

    const entry = useGalleryClientStore.getState().imageCache["img-1"];
    expect(entry?.renderUrl).toBe("blob:x");
  });

  it("surfaces query pending status", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.result.status).toBe("pending");
  });

  it("surfaces query error status", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("fail") });

    const { result } = renderHook(() => useGalleryData());

    expect(result.current.result.status).toBe("error");
  });
});
