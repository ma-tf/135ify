import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mockUseGalleryFiles = vi.hoisted(() => vi.fn());

vi.mock("@features/gallery/use-gallery-files", () => ({
  useGalleryFiles: mockUseGalleryFiles,
}));

vi.mock("@features/gallery/use-gallery-update-params", () => ({
  useGalleryUpdateParams: () => ({ updateParams: vi.fn() }),
}));

vi.mock("@features/gallery/use-gallery-update-file", () => ({
  useGalleryUpdateFile: () => ({ updateFile: vi.fn() }),
}));

vi.mock("@features/gallery/use-gallery-remove-file", () => ({
  useGalleryRemoveFile: () => ({ removeFile: vi.fn() }),
}));

vi.mock("@features/gallery/use-gallery-add-files", () => ({
  useGalleryAddFiles: () => ({ addFiles: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: any) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock("@features/image/use-ensure-processed", () => ({
  EnsureProcessedOrchestrator: () => <div data-testid="ensure-processed" />,
}));

import { GalleryStorageAdapter } from "@features/gallery/gallery-storage-adapter";

setupTests();

const makeFile = (overrides: Partial<FileRecord> = {}): FileRecord => ({
  id: "img-1",
  fileName: "test.jpg",
  sourceUrl: "blob:url",
  params: { ...DEFAULT_PARAMS },
  convexId: "img-1",
  createdAt: 0,
  renderUrl: null,
  isProcessing: false,
  renderError: null,
  ...overrides,
});

describe("GalleryStorageAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGalleryFiles.mockReturnValue({
      files: [],
      pendingFiles: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders null when loading", () => {
    mockUseGalleryFiles.mockReturnValue({
      files: [],
      pendingFiles: [],
      loading: true,
      error: null,
    });

    const { container } = render(
      <GalleryStorageAdapter imageId="img-1">
        <div data-testid="child">content</div>
      </GalleryStorageAdapter>,
    );

    expect(container.innerHTML).toBe("");
    expect(screen.queryByTestId("navigate")).toBeNull();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders Navigate when there is an error", () => {
    mockUseGalleryFiles.mockReturnValue({
      files: [],
      pendingFiles: [],
      loading: false,
      error: new Error("fail"),
    });

    render(
      <GalleryStorageAdapter imageId="img-1">
        <div data-testid="child">content</div>
      </GalleryStorageAdapter>,
    );

    const navigate = screen.getByTestId("navigate");
    expect(navigate.dataset.to).toBe("/gallery");
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders Navigate when files are empty", () => {
    render(
      <GalleryStorageAdapter imageId="img-1">
        <div data-testid="child">content</div>
      </GalleryStorageAdapter>,
    );

    expect(screen.getByTestId("navigate")).toBeDefined();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders children and EnsureProcessedOrchestrator when files are present", () => {
    mockUseGalleryFiles.mockReturnValue({
      files: [makeFile()],
      pendingFiles: [],
      loading: false,
      error: null,
    });

    render(
      <GalleryStorageAdapter imageId="img-1">
        <div data-testid="child">content</div>
      </GalleryStorageAdapter>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("ensure-processed")).toBeDefined();
  });

  it("does not render Navigate when files are present", () => {
    mockUseGalleryFiles.mockReturnValue({
      files: [makeFile()],
      pendingFiles: [],
      loading: false,
      error: null,
    });

    render(
      <GalleryStorageAdapter imageId="img-1">
        <div data-testid="child">content</div>
      </GalleryStorageAdapter>,
    );

    expect(screen.queryByTestId("navigate")).toBeNull();
  });
});
