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
  Link: ({ to, params, children }: any) => {
    let href = to;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        href = href.replace(`$${key}`, value as string);
      }
    }
    return (
      <a href={href}>{typeof children === "function" ? children({ isActive: false }) : children}</a>
    );
  },
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
  imageCount: 3,
  imageLimit: 10,
  storageLimitBytes: 50 * 1024 * 1024,
};

function mockImage(
  overrides: Partial<
    Doc<"images"> & {
      sourceUrl: string | null;
    }
  > = {},
) {
  return {
    _id: "img1" as Doc<"images">["_id"],
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    userId: "user1" as Doc<"images">["userId"],
    sourceStorageId: "storage1" as Doc<"images">["sourceStorageId"],
    fileName: "test-photo.jpg",
    params: {
      selectedFilmId: "none",
      halationIntensity: 0,
      halationSpread: 0,
      halationThreshold: 0,
      vignetteIntensity: 0,
      vignetteFeather: 0,
      grainIntensity: 0,
    },
    source: "manual" as "openai" | "manual",
    parent: undefined as { imageId?: string; fileName: string } | undefined,
    sourceUrl: "https://example.com/source1.jpg",
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

function renderPage(images: unknown[], storage = mockStorageUsage) {
  mockUseQuery.mockReset();
  mockUseQuery
    .mockImplementationOnce(() => ({ status: "success", data: images }))
    .mockImplementationOnce(() => ({ status: "success", data: storage }))
    .mockReturnValue({ status: "success", data: images });

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
    mockUseQuery.mockReset();
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
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      source: "openai" as "openai" | "manual",
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    renderPage([take]);

    expect(screen.getByText("Images")).toBeDefined();
    expect(screen.getByText("3 of 10")).toBeDefined();
  });

  it("renders takes grouped by source image with section headers and rows", () => {
    const take1 = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      source: "openai" as "openai" | "manual",
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    const take2 = mockImage({
      _id: "take2" as Doc<"images">["_id"],
      fileName: "ai-grain-source-photo-2.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      source: "openai" as "openai" | "manual",
      _creationTime: Date.UTC(2026, 5, 17, 11, 0, 0),
    });
    renderPage([take1, take2]);

    expect(screen.getByText("source-photo.jpg")).toBeDefined();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(take1.sourceUrl);
    expect(images[1].getAttribute("src")).toBe(take2.sourceUrl);
  });

  it("renders separate groups for different source images", () => {
    const take1 = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      fileName: "ai-grain-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    const take2 = mockImage({
      _id: "take2" as Doc<"images">["_id"],
      fileName: "ai-grain-another-shot.png",
      parent: { imageId: "source2" as Doc<"images">["_id"], fileName: "another-shot.png" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take1, take2]);

    expect(screen.getByText("photo.jpg")).toBeDefined();
    expect(screen.getByText("another-shot.png")).toBeDefined();
  });

  it("keeps multiple takes under the same source image in one group", () => {
    const take1 = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    const take2 = mockImage({
      _id: "take2" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    renderPage([take1, take2]);

    expect(screen.getByText("photo.jpg")).toBeDefined();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
  });

  it("shows skeleton placeholder when sourceUrl is null", () => {
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
      sourceUrl: null,
    });

    const { container } = renderPage([take]);

    const image = container.querySelector("img");
    expect(image).toBeNull();
  });

  it("renders download and delete buttons for each take", () => {
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("calls deleteImage mutation when delete button is clicked and removes row", () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(deleteFn);
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const deleteButton = screen.getAllByRole("button")[1];
    fireEvent.click(deleteButton);

    expect(deleteFn).toHaveBeenCalledWith({ imageId: take._id });
    expect(screen.queryByText(expectedDate)).toBeNull();
  });

  it("restores row when delete mutation fails", async () => {
    const deleteFn = vi.fn().mockRejectedValue(new Error("Failed"));
    mockUseMutation.mockReturnValue(deleteFn);
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const deleteButton = screen.getAllByRole("button")[1];
    fireEvent.click(deleteButton);

    expect(screen.queryByText(expectedDate)).toBeNull();

    await act(async () => {});

    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("downloads full image when download button is clicked", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: () => Promise.resolve(new Blob()),
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
    } as Response);

    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const downloadButton = screen.getAllByRole("button")[0];
    fireEvent.click(downloadButton);

    await act(async () => {});

    expect(fetchSpy).toHaveBeenCalledWith(take.sourceUrl);

    fetchSpy.mockRestore();
  });

  it("calls markSeen on mount", () => {
    const images: unknown[] = [];
    renderPage(images);

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
  });

  it("links take thumbnail to the AI grain image in gallery", () => {
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const links = screen.getAllByRole("link");
    const thumbnailLink = links.find((l) => l.querySelector("img"));
    expect(thumbnailLink?.getAttribute("href")).toBe(`/gallery/${take._id}`);
  });

  it("links take filename to the AI grain image in gallery", () => {
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const filenameLink = screen.getByText("ai-grain-source-photo.jpg");
    expect(filenameLink.closest("a")?.getAttribute("href")).toBe(`/gallery/${take._id}`);
  });

  it("links group source file name to the parent image in gallery", () => {
    const take = mockImage({
      _id: "take1" as Doc<"images">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      source: "openai" as "openai" | "manual",
    });
    renderPage([take]);

    const groupHeader = screen.getByText("source-photo.jpg");
    expect(groupHeader.closest("a")?.getAttribute("href")).toBe("/gallery/source1");
  });
});
