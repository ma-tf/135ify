import type { Doc } from "@convex/_generated/dataModel";

import { GalleryPage } from "@features/gallery/gallery-page";
import { formatTimestamp } from "@lib/utils";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@config", () => ({
  BASE_PATH: "",
  FEATURE_AI_GRAIN: false,
  FEATURE_SIGN_IN: false,
  FEATURE_SUBSCRIPTIONS: false,
  FILE_SIZE_LIMIT_BYTES: 5 * 1024 * 1024,
  GRAIN_URL: "",
}));

const { mockNavigate, mockUseQuery } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@features/gallery/gallery-usage-bar", () => ({
  UsageBar: () => null,
  UsageBarSkeleton: () => null,
}));

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn((url: string) => Promise.resolve(url)),
}));

setupTests();

const makeMockDoc = (
  overrides: Partial<Doc<"images"> & { sourceUrl: string | null }> = {},
): Doc<"images"> & { sourceUrl: string | null } => ({
  _id: "img123" as Doc<"images">["_id"],
  _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
  userId: "user1" as Doc<"images">["userId"],
  sourceStorageId: "storage1" as Doc<"images">["sourceStorageId"],
  fileName: "test-photo.jpg",
  source: "manual" as "openai" | "manual",
  sourceUrl: "blob:render-1",
  params: { ...DEFAULT_PARAMS },
  ...overrides,
});

describe("GalleryPage", () => {
  it("shows empty state message when user has no saved images", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    render(<GalleryPage />);

    expect(screen.getByText(/no saved images/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /process/i })).toBeDefined();
  });

  it("renders a grid of image cards when images exist", async () => {
    const doc1 = makeMockDoc();
    const doc2 = makeMockDoc({
      _id: "img456" as Doc<"images">["_id"],
      fileName: "another-shot.png",
      sourceUrl: "blob:render-2",
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    mockUseQuery.mockReturnValue({ status: "success", data: [doc1, doc2] });

    render(<GalleryPage />);

    await vi.waitFor(() => {
      expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
    });

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(doc1.sourceUrl);
    expect(images[1].getAttribute("src")).toBe(doc2.sourceUrl);

    expect(screen.getByText(doc1.fileName)).toBeDefined();
    expect(screen.getByText(doc2.fileName)).toBeDefined();

    const expectedDate = formatTimestamp(doc1._creationTime);
    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("navigates to /gallery/$imageId when a card is clicked", () => {
    const doc = makeMockDoc();
    mockUseQuery.mockReturnValue({ status: "success", data: [doc] });

    render(<GalleryPage />);

    const card = screen.getByText(doc.fileName).closest('[class*="cursor-pointer"]')!;
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/gallery/$imageId",
      params: { imageId: doc._id },
    });
  });

  it("shows skeleton placeholders while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { container } = render(<GalleryPage />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(8);
  });

  it("shows error message when loading fails", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("Failed to fetch") });

    render(<GalleryPage />);

    expect(screen.getByText(/failed to load images/i)).toBeDefined();
  });
});
