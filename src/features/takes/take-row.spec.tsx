import type { TakeRowTake } from "@features/takes/take-row";

import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { TakeRow } from "./take-row";

const { mockUseMutation } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
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
  useMutation: mockUseMutation,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

setupTests();

function mockTake(overrides: Partial<TakeRowTake> = {}): TakeRowTake {
  return {
    _id: "take-1",
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    sourceUrl: "https://example.com/take1.jpg",
    fileName: "ai-grain-photo.jpg",
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

describe("TakeRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders completed row with thumbnail, filename link, and action buttons", () => {
    render(<TakeRow take={mockTake({ status: "completed" })} />);

    expect(screen.getByRole("img")).toBeDefined();
    expect(screen.getByText("ai-grain-photo.jpg")).toBeDefined();

    const links = screen.getAllByRole("link");
    const thumbnailLink = links.find((l) => l.querySelector("img"));
    expect(thumbnailLink?.getAttribute("href")).toBe("/gallery/take-1");
    expect(screen.getByText("ai-grain-photo.jpg").closest("a")?.getAttribute("href")).toBe(
      "/gallery/take-1",
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("renders completed row when status is absent", () => {
    render(<TakeRow take={mockTake({ status: undefined })} />);

    expect(screen.getByRole("img")).toBeDefined();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("renders queued row with skeleton, plain text, badge, and delete only", () => {
    const { container } = render(
      <TakeRow take={mockTake({ status: "queued", sourceUrl: null })} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Queued")).toBeDefined();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders processing row with skeleton, badge with spinner, and delete only", () => {
    const { container } = render(
      <TakeRow take={mockTake({ status: "processing", sourceUrl: null })} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Processing")).toBeDefined();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders failed row with skeleton, failed badge, and delete only", () => {
    const { container } = render(
      <TakeRow
        take={mockTake({ status: "failed", sourceUrl: null, failureReason: "API error" })}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Failed")).toBeDefined();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("calls deleteImage mutation when delete button is clicked and removes row", () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(deleteFn);
    render(<TakeRow take={mockTake({ status: "completed" })} />);

    const deleteButton = screen.getAllByRole("button")[1];
    fireEvent.click(deleteButton);

    expect(deleteFn).toHaveBeenCalledWith({ imageId: "take-1" });
    expect(screen.queryByText(expectedDate)).toBeNull();
  });

  it("restores row when delete mutation fails", async () => {
    const deleteFn = vi.fn().mockRejectedValue(new Error("Failed"));
    mockUseMutation.mockReturnValue(deleteFn);
    render(<TakeRow take={mockTake({ status: "completed" })} />);

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

    render(<TakeRow take={mockTake({ status: "completed" })} />);

    const downloadButton = screen.getAllByRole("button")[0];
    fireEvent.click(downloadButton);

    await act(async () => {});

    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/take1.jpg");

    fetchSpy.mockRestore();
  });

  it("shows failureReason as title attribute on failed badge", () => {
    render(
      <TakeRow
        take={mockTake({ status: "failed", sourceUrl: null, failureReason: "overQuota" })}
      />,
    );

    const badge = screen.getByText("Failed");
    expect(badge.getAttribute("title")).toBe("overQuota");
  });
});
