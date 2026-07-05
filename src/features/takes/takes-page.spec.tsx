import type { Doc } from "@convex/_generated/dataModel";

import { setupTests } from "@test-utils/setup.spec";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { TakesPage } from "./takes-page";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

setupTests();

function mockTake(
  overrides: Partial<
    Doc<"aiTakes"> & {
      sourceFileName: string | null;
      previewUrl: string | null;
      fullUrl: string | null;
    }
  > = {},
) {
  return {
    _id: "take1" as Doc<"aiTakes">["_id"],
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    userId: "user1" as Doc<"aiTakes">["userId"],
    sourceImageId: "img123" as Doc<"aiTakes">["sourceImageId"],
    previewStorageId: "preview1" as Doc<"aiTakes">["previewStorageId"],
    fullStorageId: "full1" as Doc<"aiTakes">["fullStorageId"],
    sourceFileName: "test-photo.jpg",
    previewUrl: "https://example.com/preview1.jpg",
    fullUrl: "https://example.com/full1.jpg",
    ...overrides,
  };
}

const expectedDate =
  new Date(Date.UTC(2026, 5, 16, 16, 1, 11)).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

describe("TakesPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state message when user has no AI Takes", async () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/no ai takes yet/i)).toBeDefined();
  });

  it("shows skeleton placeholders while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { container } = render(<TakesPage />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error message when loading fails", async () => {
    mockUseQuery.mockReturnValue({
      status: "error",
      error: new Error("Failed"),
    });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/failed to load/i)).toBeDefined();
  });

  it("renders takes grouped by source image with section headers and rows", async () => {
    const take1 = mockTake();
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });

    mockUseQuery.mockReturnValue({ status: "success", data: [take1, take2] });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("test-photo.jpg");

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(take1.previewUrl);
    expect(images[1].getAttribute("src")).toBe(take2.previewUrl);

    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("renders separate groups for different source images", async () => {
    const take1 = mockTake();
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      sourceImageId: "img456" as Doc<"aiTakes">["sourceImageId"],
      sourceFileName: "another-shot.png",
    });

    mockUseQuery.mockReturnValue({ status: "success", data: [take1, take2] });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(2);
    expect(headings[0].textContent).toBe("test-photo.jpg");
    expect(headings[1].textContent).toBe("another-shot.png");
  });

  it("keeps multiple takes under the same source image in one group", async () => {
    const take1 = mockTake({ _id: "take1" as Doc<"aiTakes">["_id"] });
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });

    mockUseQuery.mockReturnValue({ status: "success", data: [take1, take2] });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("test-photo.jpg");

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
  });

  it("falls back to Unknown when sourceFileName is null", async () => {
    const take = mockTake({ sourceFileName: null });

    mockUseQuery.mockReturnValue({ status: "success", data: [take] });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const unknowns = screen.getAllByText("Unknown");
    expect(unknowns.length).toBeGreaterThan(0);
  });

  it("shows skeleton placeholder when previewUrl is null", async () => {
    const take = mockTake({ previewUrl: null });

    mockUseQuery.mockReturnValue({ status: "success", data: [take] });

    const { container } = render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const image = container.querySelector("img");
    expect(image).toBeNull();
  });
});
