import type { TakeRowJob } from "@features/takes/take-row-thumbnail";

import { PendingTakeRow } from "@features/takes/pending-take-row";
import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

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

setupTests();

function mockJob(overrides: Partial<TakeRowJob> = {}): TakeRowJob {
  return {
    _id: "job-1",
    _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
    fileName: "photo.jpg",
    status: "processing",
    thumbnailBase64: "dGVzdC10aHVtYm5haWw=",
    takeImageId: "img-1",
    takeImageUrl: "https://example.com/full-image.jpg",
    overQuotaStorageId: undefined,
    size: null,
    ...overrides,
  };
}

describe("PendingTakeRow", () => {
  it("renders processing row with skeleton, badge, and no action buttons", () => {
    const { container } = render(
      <PendingTakeRow job={mockJob({ status: "processing", thumbnailBase64: null })} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Processing")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
