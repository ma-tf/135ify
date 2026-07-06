import type { Doc } from "@convex/_generated/dataModel";

import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { TakesPage } from "./takes-page";

const { mockUseQuery, mockUseMutation, mockMarkSeen } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockMarkSeen: vi.fn(),
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
  useMutation: mockUseMutation,
}));

vi.mock("@stores/takes-notification-store", () => ({
  useTakesNotificationStore: (selector: any) => {
    const state = { lastSeenAt: null, markSeen: mockMarkSeen };
    return selector ? selector(state) : state;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

setupTests();

const mockStorageUsage = {
  usedBytes: 5 * 1024 * 1024,
  imageCount: 2,
  imageLimit: 10,
  storageLimitBytes: 50 * 1024 * 1024,
};

function mockTake(
  overrides: Partial<
    Doc<"aiTakes"> & {
      sourceFileName: string;
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

function renderPage(takes: unknown[], storage = mockStorageUsage) {
  mockUseQuery.mockReset();
  mockUseQuery
    .mockReturnValueOnce({ status: "success", data: takes })
    .mockReturnValueOnce({ status: "success", data: storage })
    .mockReturnValue({ status: "success", data: takes });

  const result = render(<TakesPage />);
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  return result;
}

describe("TakesPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state message and CTA link when user has no AI Takes", () => {
    renderPage([]);

    expect(screen.getByText(/no ai takes yet/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /process.*first image/i })).toBeDefined();
  });

  it("shows skeleton placeholders while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    const { container } = render(<TakesPage />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error message when loading fails", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("Failed") });

    render(<TakesPage />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/failed to load/i)).toBeDefined();
  });

  it("renders usage bar with count when storage is loaded", () => {
    const take = mockTake();
    renderPage([take]);

    expect(screen.getByText("Images")).toBeDefined();
    expect(screen.getByText("2 of 10")).toBeDefined();
  });

  it("renders takes grouped by source image with section headers and rows", () => {
    const take1 = mockTake();
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    renderPage([take1, take2]);

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("test-photo.jpg");

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(take1.previewUrl);
    expect(images[1].getAttribute("src")).toBe(take2.previewUrl);

    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("renders separate groups for different source images", () => {
    const take1 = mockTake();
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      sourceImageId: "img456" as Doc<"aiTakes">["sourceImageId"],
      sourceFileName: "another-shot.png",
    });
    renderPage([take1, take2]);

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(2);
    expect(headings[0].textContent).toBe("test-photo.jpg");
    expect(headings[1].textContent).toBe("another-shot.png");
  });

  it("keeps multiple takes under the same source image in one group", () => {
    const take1 = mockTake({ _id: "take1" as Doc<"aiTakes">["_id"] });
    const take2 = mockTake({
      _id: "take2" as Doc<"aiTakes">["_id"],
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    renderPage([take1, take2]);

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("test-photo.jpg");

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
  });

  it("shows skeleton placeholder when previewUrl is null", () => {
    const take = mockTake({ previewUrl: null });

    const { container } = renderPage([take]);

    const image = container.querySelector("img");
    expect(image).toBeNull();
  });

  it("renders download and delete buttons for each take", () => {
    const take = mockTake();
    renderPage([take]);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("calls deleteTake mutation when delete button is clicked and removes row", () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(deleteFn);
    const take = mockTake();
    renderPage([take]);

    const deleteButton = screen.getAllByRole("button")[1];
    fireEvent.click(deleteButton);

    expect(deleteFn).toHaveBeenCalledWith({ takeId: take._id });
    expect(screen.queryByText(expectedDate)).toBeNull();
  });

  it("restores row when delete mutation fails", async () => {
    const deleteFn = vi.fn().mockRejectedValue(new Error("Failed"));
    mockUseMutation.mockReturnValue(deleteFn);
    const take = mockTake();
    renderPage([take]);

    const deleteButton = screen.getAllByRole("button")[1];
    fireEvent.click(deleteButton);

    expect(screen.queryByText(expectedDate)).toBeNull();

    await act(async () => {});

    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("downloads full image when download button is clicked", async () => {
    const originalCreateElement = document.createElement.bind(document);
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) =>
        tag === "a" ? (mockAnchor as unknown as HTMLElement) : originalCreateElement(tag),
      );
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) }));

    const take = mockTake();
    renderPage([take]);

    const downloadButton = screen.getAllByRole("button")[0];
    fireEvent.click(downloadButton);

    await act(async () => {});

    expect(fetch).toHaveBeenCalledWith(take.fullUrl);
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.download).toBe("test-photo-ai-grain.jpg");

    createElementSpy.mockRestore();
  });

  it("calls markSeen on mount", () => {
    renderPage([]);

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
  });
});
