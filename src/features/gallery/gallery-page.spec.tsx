import type { FileRecord } from "@stores/file-store-types";

import { StorageContext, type StorageContextValue } from "@providers/storage-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vite-plus/test";

import { GalleryPage } from "./gallery-page";

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

setupTests();

const mockFileRecord: FileRecord = {
  id: "img123",
  fileName: "test-photo.jpg",
  sourceUrl: "https://example.com/photo.jpg",
  params: DEFAULT_PARAMS,
  createdAt: Date.UTC(2026, 5, 16, 16, 1, 11),
};

const mockFileRecord2: FileRecord = {
  id: "img456",
  fileName: "another-shot.png",
  sourceUrl: "https://example.com/photo2.jpg",
  params: DEFAULT_PARAMS,
  createdAt: Date.UTC(2026, 5, 17, 10, 30, 0),
};

function createValue(overrides?: Partial<StorageContextValue>): StorageContextValue {
  return {
    files: [],
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    updateParams: vi.fn(),
    loading: false,
    error: null,
    ...overrides,
  };
}

function renderGalleryPage(value: StorageContextValue, children?: ReactNode) {
  return render(
    <StorageContext.Provider value={value}>
      {children}
      <GalleryPage />
    </StorageContext.Provider>,
  );
}

describe("GalleryPage", () => {
  it("shows empty state message when user has no saved images", () => {
    renderGalleryPage(createValue({ files: [] }));

    expect(screen.getByText(/no saved images/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /process/i })).toBeDefined();
  });

  it("renders a grid of image cards when images exist", () => {
    renderGalleryPage(createValue({ files: [mockFileRecord, mockFileRecord2] }));

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(mockFileRecord.sourceUrl);
    expect(images[1].getAttribute("src")).toBe(mockFileRecord2.sourceUrl);

    expect(screen.getByText(mockFileRecord.fileName)).toBeDefined();
    expect(screen.getByText(mockFileRecord2.fileName)).toBeDefined();

    const expectedDate =
      new Date(mockFileRecord.createdAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }) + " UTC";
    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("navigates to /gallery/$imageId when a card is clicked", () => {
    renderGalleryPage(createValue({ files: [mockFileRecord] }));

    const card = screen.getByText(mockFileRecord.fileName).closest('[class*="cursor-pointer"]')!;
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/gallery/$imageId",
      params: { imageId: mockFileRecord.id },
    });
  });

  it("shows skeleton placeholders while loading", () => {
    const { container } = renderGalleryPage(createValue({ loading: true, files: [] }));

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(8);
  });

  it("shows error message when loading fails", () => {
    renderGalleryPage(createValue({ error: new Error("Failed to fetch"), files: [] }));

    expect(screen.getByText(/failed to load images/i)).toBeDefined();
  });
});
