import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import type { TakeRowJob } from "./take-row-thumbnail";

import { PendingTakeRow } from "./pending-take-row";

const { mockRetryJob, mockProcessJob, mockUseAiProviderStore } = vi.hoisted(() => ({
  mockRetryJob: vi.fn().mockResolvedValue(undefined),
  mockProcessJob: vi.fn().mockResolvedValue(undefined),
  mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
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
  useAction: () => mockProcessJob,
  useMutation: () => mockRetryJob,
  useQuery_experimental: vi.fn(),
}));

vi.mock("@stores/ai-provider-store", () => ({
  useAiProviderStore: mockUseAiProviderStore,
}));

vi.mock("@components/ai-key-dialog", () => ({
  AiKeyDialog: ({ onSave, onOpenChange }: any) => (
    <div data-testid="ai-key-dialog">
      <button onClick={() => onSave("sk-test-key")}>Save Key</button>
      <button onClick={() => onOpenChange(false)}>Cancel</button>
    </div>
  ),
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

  it("renders failed row with warning icon, failed badge, and retry button", () => {
    const { container } = render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Failed")).toBeDefined();
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("shows failureReason as title attribute on failed badge", () => {
    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "overQuota" })}
      />,
    );

    const badge = screen.getByText("Failed");
    expect(badge.getAttribute("title")).toBe("overQuota");
  });

  it("opens API key dialog when retry is clicked without an API key", () => {
    mockUseAiProviderStore.mockReturnValue({ apiKey: "" });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);

    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
    expect(mockRetryJob).not.toHaveBeenCalled();
  });

  it("retries the job when retry is clicked with an API key", () => {
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-existing" });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);

    expect(mockRetryJob).toHaveBeenCalledWith({ jobId: "job-1" });
  });
});
