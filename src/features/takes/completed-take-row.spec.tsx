import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { TakeRowJob } from "./take-row-thumbnail";

import { CompletedTakeRow } from "./completed-take-row";

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

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

setupTests();

function mockJob(overrides: Partial<TakeRowJob> = {}): TakeRowJob {
  return {
    _id: "job-1",
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    fileName: "photo.jpg",
    status: "completed",
    thumbnailBase64: "dGVzdC10aHVtYm5haWw=",
    takeImageId: "img-1",
    takeImageUrl: "https://example.com/full-image.jpg",
    overQuotaStorageId: undefined,
    size: null,
    ...overrides,
  };
}

describe("CompletedTakeRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders completed row with thumbnail, filename link, and download button", () => {
    render(<CompletedTakeRow job={mockJob()} />);

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe("data:image/jpeg;base64,dGVzdC10aHVtYm5haWw=");

    expect(screen.getByText("photo.jpg")).toBeDefined();

    const links = screen.getAllByRole("link");
    const thumbnailLink = links.find((l) => l.querySelector("img"));
    expect(thumbnailLink?.getAttribute("href")).toBe("/gallery/img-1");
    expect(screen.getByText("photo.jpg").closest("a")?.getAttribute("href")).toBe("/gallery/img-1");

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

    render(<CompletedTakeRow job={mockJob()} />);

    const downloadButton = screen.getByRole("button");
    fireEvent.click(downloadButton);

    await act(async () => {});

    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/full-image.jpg");

    fetchSpy.mockRestore();
  });
});
