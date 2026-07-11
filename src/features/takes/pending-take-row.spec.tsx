import type { TakeRowJob } from "@features/takes/take-row-thumbnail";

import { PendingTakeRow } from "@features/takes/pending-take-row";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseRetryTake, mockRetryFn } = vi.hoisted(() => ({
  mockUseRetryTake: vi.fn(),
  mockRetryFn: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@features/takes/use-retry-take", () => ({
  useRetryTake: mockUseRetryTake,
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
  beforeEach(() => {
    mockUseRetryTake.mockReturnValue({
      retry: mockRetryFn,
      isRetrying: false,
      hasApiKey: true,
    });
  });

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
    mockUseRetryTake.mockReturnValue({
      retry: mockRetryFn,
      isRetrying: false,
      hasApiKey: false,
    });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);

    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
    expect(mockRetryFn).not.toHaveBeenCalled();
  });

  it("retries the job when retry is clicked with an API key", () => {
    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);

    expect(mockRetryFn).toHaveBeenCalledWith("job-1");
  });

  it("shows spinner on retry button when isRetrying is true", () => {
    mockUseRetryTake.mockReturnValue({
      retry: mockRetryFn,
      isRetrying: true,
      hasApiKey: true,
    });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    expect(retryButton.getAttribute("disabled")).not.toBeNull();
    expect(retryButton.querySelector("svg")).toBeDefined();
  });

  it("saves API key from dialog and calls retry with the provided key", () => {
    mockUseRetryTake.mockReturnValue({
      retry: mockRetryFn,
      isRetrying: false,
      hasApiKey: false,
    });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);
    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();

    const saveKeyButton = screen.getByText("Save Key");
    fireEvent.click(saveKeyButton);

    expect(mockRetryFn).toHaveBeenCalledWith("job-1", "sk-test-key");
    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();
  });

  it("closes API key dialog without retrying when cancelled", () => {
    mockUseRetryTake.mockReturnValue({
      retry: mockRetryFn,
      isRetrying: false,
      hasApiKey: false,
    });

    render(
      <PendingTakeRow
        job={mockJob({ status: "failed", thumbnailBase64: null, failureReason: "API error" })}
      />,
    );

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);
    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockRetryFn).not.toHaveBeenCalled();
    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();
  });
});
