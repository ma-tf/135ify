import type { Doc } from "@convex/_generated/dataModel";

import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import { GalleryPage } from "./gallery-page";

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

vi.mock("@features/process/process-image", () => ({
  processToBlobUrl: vi.fn((url: string) => Promise.resolve(url)),
}));

setupTests();

const mockDoc: Doc<"images"> & { sourceUrl: string | null } = {
  _id: "img123" as Doc<"images">["_id"],
  _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
  userId: "user1" as Doc<"images">["userId"],
  sourceStorageId: "storage1" as Doc<"images">["sourceStorageId"],
  fileName: "test-photo.jpg",
  sourceUrl: "blob:render-1",
  params: { ...DEFAULT_PARAMS },
};

const mockDoc2: Doc<"images"> & { sourceUrl: string | null } = {
  _id: "img456" as Doc<"images">["_id"],
  _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
  userId: "user1" as Doc<"images">["userId"],
  sourceStorageId: "storage2" as Doc<"images">["sourceStorageId"],
  fileName: "another-shot.png",
  sourceUrl: "blob:render-2",
  params: { ...DEFAULT_PARAMS },
};

describe("GalleryPage", () => {
  it("shows empty state message when user has no saved images", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    render(<GalleryPage />);

    expect(screen.getByText(/no saved images/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /process/i })).toBeDefined();
  });

  it("renders a grid of image cards when images exist", async () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [mockDoc, mockDoc2] });

    render(<GalleryPage />);

    await act(async () => {});

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(mockDoc.sourceUrl);
    expect(images[1].getAttribute("src")).toBe(mockDoc2.sourceUrl);

    expect(screen.getByText(mockDoc.fileName)).toBeDefined();
    expect(screen.getByText(mockDoc2.fileName)).toBeDefined();

    const expectedDate =
      new Date(mockDoc._creationTime).toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC";
    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("navigates to /gallery/$imageId when a card is clicked", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [mockDoc] });

    render(<GalleryPage />);

    const card = screen.getByText(mockDoc.fileName).closest('[class*="cursor-pointer"]')!;
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/gallery/$imageId",
      params: { imageId: mockDoc._id },
    });
  });

  it("shows skeleton placeholders while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { container } = render(<GalleryPage />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(12);
  });

  it("shows error message when loading fails", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("Failed to fetch") });

    render(<GalleryPage />);

    expect(screen.getByText(/failed to load images/i)).toBeDefined();
  });
});
