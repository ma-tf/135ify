import type { Doc } from "@convex/_generated/dataModel";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { useGalleryClientStore } from "@stores/gallery-client-store";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

import { useGalleryFiles } from "@features/gallery/use-gallery-files";

const makeDoc = (
  overrides: Partial<Doc<"images"> & { sourceUrl: string | null; size?: number | null }> = {},
) => {
  const doc: Doc<"images"> & { sourceUrl: string | null; size?: number | null } = {
    _id: "img-1" as Doc<"images">["_id"],
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    userId: "user1" as Doc<"images">["userId"],
    sourceStorageId: "storage1" as Doc<"images">["sourceStorageId"],
    fileName: "test-photo.jpg",
    source: "manual" as "openai" | "manual",
    sourceUrl: "https://example.com/storage/1",
    params: { ...DEFAULT_PARAMS },
    ...overrides,
  };
  return doc;
};

describe("useGalleryFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGalleryClientStore.setState({
      localParams: null,
      localRenderUrl: null,
      localIsProcessing: false,
      localRenderError: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("returns loading when query is pending", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns error when query errors", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("fail") });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.loading).toBe(false);
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toEqual(new Error("fail"));
  });

  it("returns empty files when query data is null", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: null });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files).toEqual([]);
    expect(result.current.pendingFiles).toEqual([]);
  });

  it("returns empty files when query data is undefined", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: undefined });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files).toEqual([]);
  });

  it("maps doc fields into FileRecord", () => {
    const doc = makeDoc({ size: 12345 });
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files).toHaveLength(1);
    const file = result.current.files[0];
    expect(file.id).toBe(doc._id);
    expect(file.fileName).toBe(doc.fileName);
    expect(file.sourceUrl).toBe(doc.sourceUrl);
    expect(file.params).toEqual(doc.params);
    expect(file.createdAt).toBe(doc._creationTime);
    expect(file.convexId).toBe(doc._id);
    expect(file.size).toBe(12345);
    expect(file.renderUrl).toBeNull();
    expect(file.isProcessing).toBe(false);
    expect(file.renderError).toBeNull();
  });

  it("merges localParams from store into file params", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localParams: { grainIntensity: 50 } });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files[0].params.grainIntensity).toBe(50);
  });

  it("merges localRenderUrl from store", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localRenderUrl: "blob:rendered" });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files[0].renderUrl).toBe("blob:rendered");
  });

  it("merges localIsProcessing from store", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localIsProcessing: true });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files[0].isProcessing).toBe(true);
  });

  it("merges localRenderError from store", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localRenderError: "something went wrong" });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files[0].renderError).toBe("something went wrong");
  });

  it("pendingFiles excludes rendered files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localRenderUrl: "blob:done" });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.pendingFiles).toEqual([]);
  });

  it("pendingFiles excludes processing files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    useGalleryClientStore.setState({ localIsProcessing: true });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.pendingFiles).toEqual([]);
  });

  it("pendingFiles includes unprocessed files", () => {
    const doc = makeDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.pendingFiles).toHaveLength(1);
    expect(result.current.pendingFiles[0].id).toBe(doc._id);
  });

  it("uses empty string fallback when sourceUrl is null", () => {
    const doc = makeDoc({ sourceUrl: null });
    mockUseQuery.mockReturnValue({ status: "success", data: doc });

    const { result } = renderHook(() => useGalleryFiles("img-1"));

    expect(result.current.files[0].sourceUrl).toBe("");
  });

  it("calls clear on unmount", () => {
    useGalleryClientStore.setState({ localParams: { grainIntensity: 50 } });
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { unmount } = renderHook(() => useGalleryFiles("img-1"));
    unmount();

    expect(useGalleryClientStore.getState().localParams).toBeNull();
  });
});
