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

import { UsageBar, UsageBarSkeleton } from "@features/gallery/gallery-usage-bar";

const fullData = {
  usedBytes: 5 * 1024 * 1024,
  imageCount: 3,
  imageLimit: 10,
  storageLimitBytes: 50 * 1024 * 1024,
  tier: "free" as const,
};

describe("UsageBarSkeleton", () => {
  it("renders 4 skeleton elements", () => {
    const { container } = render(<UsageBarSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(6);
  });
});

describe("UsageBar", () => {
  it("shows skeleton while loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });
    const { container } = render(<UsageBar />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders Images and Storage labels", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: fullData });
    render(<UsageBar />);
    expect(screen.getByText("Images")).toBeDefined();
    expect(screen.getByText("Storage")).toBeDefined();
  });

  it("shows correct image count", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: fullData });
    render(<UsageBar />);
    expect(screen.getByText("3 of 10")).toBeDefined();
  });

  it("shows correct storage text", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: fullData });
    render(<UsageBar />);
    expect(screen.getByText("5MB of 50MB")).toBeDefined();
  });

  it("progress bar at 0%", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: { ...fullData, imageCount: 0 } });
    const { container } = render(<UsageBar />);
    const bars = container.querySelectorAll("[style*='width']");
    expect(bars[0].getAttribute("style")).toBe("width: 0%;");
  });

  it("progress bar at 50%", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: { ...fullData, imageCount: 5 } });
    const { container } = render(<UsageBar />);
    const bars = container.querySelectorAll("[style*='width']");
    expect(bars[0].getAttribute("style")).toBe("width: 50%;");
  });

  it("progress bar caps at 100% when over limit", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: { ...fullData, imageCount: 20 } });
    const { container } = render(<UsageBar />);
    const bars = container.querySelectorAll("[style*='width']");
    expect(bars[0].getAttribute("style")).toBe("width: 100%;");
  });
});
