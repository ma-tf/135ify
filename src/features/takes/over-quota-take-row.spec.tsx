import { setupTests } from "@test-utils/setup.spec";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { TakeRowJob } from "./take-row-thumbnail";

import { OverQuotaTakeRow } from "./over-quota-take-row";

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

let mockOverQuotaUrl: string | null = null;

vi.mock("convex/react", () => ({
  useQuery_experimental: vi.fn((opts: any): any => {
    if (opts.args?.jobId) {
      return { status: "success", data: mockOverQuotaUrl };
    }
    return { status: "success", data: [] };
  }),
  useMutation: () => vi.fn(),
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
    ...overrides,
  };
}

describe("OverQuotaTakeRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockOverQuotaUrl = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    mockOverQuotaUrl = null;
  });

  it("renders overQuota row with thumbnail, over quota badge, and no download button", () => {
    render(
      <OverQuotaTakeRow
        job={mockJob({
          status: "overQuota",
          thumbnailBase64: "dGVzdC1vdmVyLXF1b3Rh",
          overQuotaStorageId: "storage-1",
          takeImageId: undefined,
        })}
      />,
    );

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe("data:image/jpeg;base64,dGVzdC1vdmVyLXF1b3Rh");

    expect(screen.getByText("Over Quota")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("opens OverQuotaDialog when overQuota thumbnail is clicked", () => {
    mockOverQuotaUrl = "https://example.com/over-quota-image.jpg";

    render(
      <OverQuotaTakeRow
        job={mockJob({
          status: "overQuota",
          thumbnailBase64: "dGVzdC1vdmVyLXF1b3Rh",
          overQuotaStorageId: "storage-1",
          takeImageId: undefined,
        })}
      />,
    );

    const [thumbnailButton] = screen.getAllByRole("button");
    fireEvent.click(thumbnailButton);

    expect(screen.getByAltText("AI generated preview")).toBeDefined();
  });

  it("shows resolved state for overQuota row after discard", async () => {
    mockOverQuotaUrl = "https://example.com/over-quota-image.jpg";

    render(
      <OverQuotaTakeRow
        job={mockJob({
          status: "overQuota",
          thumbnailBase64: "dGVzdC1vdmVyLXF1b3Rh",
          overQuotaStorageId: "storage-1",
          takeImageId: undefined,
        })}
      />,
    );

    const [thumbnailButton] = screen.getAllByRole("button");
    fireEvent.click(thumbnailButton);

    const discardButton = screen.getByText("Discard");
    await act(async () => {
      fireEvent.click(discardButton);
    });

    expect(screen.getByText("Resolved")).toBeDefined();
  });

  it("renders overQuota row with non-interactive thumbnail when storage is already cleared", () => {
    render(
      <OverQuotaTakeRow
        job={mockJob({
          status: "overQuota",
          thumbnailBase64: "dGVzdC1vdmVyLXF1b3Rh",
          overQuotaStorageId: undefined,
          takeImageId: undefined,
        })}
      />,
    );

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.className).toContain("opacity-50");
    expect(screen.getByText("Resolved")).toBeDefined();
  });
});
