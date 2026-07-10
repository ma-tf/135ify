import type { Doc } from "@convex/_generated/dataModel";

import { TakesPage } from "@features/takes/takes-page";
import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseQuery, mockMarkSeen } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
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
  useMutation: () => vi.fn(),
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

type MockJob = Pick<
  Doc<"aiGenerationJobs">,
  | "_id"
  | "_creationTime"
  | "fileName"
  | "parent"
  | "status"
  | "failureReason"
  | "thumbnailBase64"
  | "takeImageId"
  | "overQuotaStorageId"
> & {
  takeImageUrl: string | null;
  size: number | null;
};

function mockJob(overrides: Partial<MockJob> = {}): MockJob {
  return {
    _id: "job1" as Doc<"aiGenerationJobs">["_id"],
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    fileName: "test-photo.jpg",
    status: "completed",
    failureReason: undefined,
    thumbnailBase64: "dGVzdC10aHVtYm5haWw=",
    takeImageId: "img1" as Doc<"images">["_id"],
    takeImageUrl: "https://example.com/take1.jpg",
    parent: undefined as { imageId?: Doc<"images">["_id"]; fileName: string } | undefined,
    overQuotaStorageId: undefined as Doc<"aiGenerationJobs">["overQuotaStorageId"],
    size: null,
    ...overrides,
  };
}

function renderPage(jobs: unknown[]) {
  mockUseQuery.mockReset();
  mockUseQuery.mockReturnValue({ status: "success", data: jobs });

  const result = render(<TakesPage />);
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  return result;
}

describe("TakesPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it("renders takes grouped by source image with section headers and rows", () => {
    const job1 = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    const job2 = mockJob({
      _id: "job2" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-source-photo-2.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      _creationTime: Date.UTC(2026, 5, 17, 11, 0, 0),
    });
    renderPage([job1, job2]);

    expect(screen.getByText("source-photo.jpg")).toBeDefined();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(`data:image/jpeg;base64,${job1.thumbnailBase64}`);
    expect(images[1].getAttribute("src")).toBe(`data:image/jpeg;base64,${job2.thumbnailBase64}`);
  });

  it("renders separate groups for different source images", () => {
    const job1 = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
    });
    const job2 = mockJob({
      _id: "job2" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-another-shot.png",
      parent: { imageId: "source2" as Doc<"images">["_id"], fileName: "another-shot.png" },
    });
    renderPage([job1, job2]);

    expect(screen.getByText("photo.jpg")).toBeDefined();
    expect(screen.getByText("another-shot.png")).toBeDefined();
  });

  it("keeps multiple takes under the same source image in one group", () => {
    const job1 = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
    });
    const job2 = mockJob({
      _id: "job2" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
    });
    renderPage([job1, job2]);

    expect(screen.getByText("photo.jpg")).toBeDefined();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
  });

  it("shows skeleton placeholder when thumbnailBase64 is null", () => {
    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      thumbnailBase64: undefined,
    });

    const { container } = renderPage([job]);

    const image = container.querySelector("img");
    expect(image).toBeNull();
  });

  it("renders download button for each completed take", () => {
    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
    });
    renderPage([job]);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });

  it("downloads full image when download button is clicked", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: () => Promise.resolve(new Blob()),
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
    } as Response);

    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      takeImageUrl: "https://example.com/full-image.jpg",
    });
    renderPage([job]);

    const downloadButton = screen.getByRole("button");
    fireEvent.click(downloadButton);

    await act(async () => {});

    expect(fetchSpy).toHaveBeenCalledWith(job.takeImageUrl);

    fetchSpy.mockRestore();
  });

  it("calls markSeen on mount", () => {
    const jobs: unknown[] = [];
    renderPage(jobs);

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
  });

  it("links take thumbnail to the AI grain image in gallery", () => {
    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "photo.jpg" },
      takeImageId: "img1" as Doc<"images">["_id"],
    });
    renderPage([job]);

    const links = screen.getAllByRole("link");
    const thumbnailLink = links.find((l) => l.querySelector("img"));
    expect(thumbnailLink?.getAttribute("href")).toBe(`/gallery/${job.takeImageId}`);
  });

  it("links take filename to the AI grain image in gallery", () => {
    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
      takeImageId: "img1" as Doc<"images">["_id"],
    });
    renderPage([job]);

    const filenameLink = screen.getByText("ai-grain-source-photo.jpg");
    expect(filenameLink.closest("a")?.getAttribute("href")).toBe(`/gallery/${job.takeImageId}`);
  });

  it("links group source file name to the parent image in gallery", () => {
    const job = mockJob({
      _id: "job1" as Doc<"aiGenerationJobs">["_id"],
      fileName: "ai-grain-source-photo.jpg",
      parent: { imageId: "source1" as Doc<"images">["_id"], fileName: "source-photo.jpg" },
    });
    renderPage([job]);

    const groupHeader = screen.getByText("source-photo.jpg");
    expect(groupHeader.closest("a")?.getAttribute("href")).toBe("/gallery/source1");
  });
});
