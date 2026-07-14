import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

import { AiUsageBar, AiUsageBarSkeleton } from "@features/takes/ai-usage-bar";

const fullData = {
  usedCents: 150,
  limitCents: 200,
  atLimit: false,
  resetsAt: 1700000000000,
};

describe("AiUsageBarSkeleton", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<AiUsageBarSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("AiUsageBar", () => {
  it("shows skeleton while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });
    const { container } = render(<AiUsageBar />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("returns null when data is null", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: null });
    const { container } = render(<AiUsageBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders AI generation label and dollar amounts", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: fullData });
    render(<AiUsageBar />);
    expect(screen.getByText("AI generation")).toBeDefined();
    expect(screen.getByText("$1.50 of $2.00 this month")).toBeDefined();
  });

  it("progress bar at correct percentage", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: fullData });
    const { container } = render(<AiUsageBar />);
    const bars = container.querySelectorAll("[style*='width']");
    expect(bars[0].getAttribute("style")).toBe("width: 75%;");
  });

  it("progress bar caps at 100% when over limit", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { ...fullData, usedCents: 300, atLimit: true },
    });
    const { container } = render(<AiUsageBar />);
    const bars = container.querySelectorAll("[style*='width']");
    expect(bars[0].getAttribute("style")).toBe("width: 100%;");
  });

  it("shows cap exceeded message when atLimit is true", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { ...fullData, usedCents: 200, atLimit: true },
    });
    render(<AiUsageBar />);
    expect(screen.getByText(/Monthly cap reached/)).toBeDefined();
  });

  it("returns null on query error", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("fail") });
    const { container } = render(<AiUsageBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows amber progress bar when at or above 90% usage", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { ...fullData, usedCents: 180, atLimit: false },
    });
    const { container } = render(<AiUsageBar />);
    expect(container.querySelector(".bg-amber-500")).toBeDefined();
  });
});
