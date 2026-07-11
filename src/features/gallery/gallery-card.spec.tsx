import { GalleryCard } from "@features/gallery/gallery-card";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD, TEST_FILE_RECORD_WITH_RENDER } from "@test-utils/test-fixtures.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@lib/utils", () => ({
  formatTimestamp: () => "1 Jan 2024, 00:00 UTC",
  formatBytes: (bytes: number) => `${bytes} B`,
}));

vi.mock("@components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

setupTests();

describe("GalleryCard", () => {
  it("renders image from renderUrl when present", () => {
    render(<GalleryCard image={TEST_FILE_RECORD_WITH_RENDER} />);

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:render-url");
    expect(img.getAttribute("alt")).toBe("test.jpg");
    expect(screen.getByText("test.jpg")).toBeDefined();
  });

  it("renders image from sourceUrl when no renderUrl and not processing", () => {
    render(<GalleryCard image={TEST_FILE_RECORD} />);

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:preview-url");
    expect(img.getAttribute("alt")).toBe("test.jpg");
  });

  it("renders skeleton when isProcessing", () => {
    const processingImage = { ...TEST_FILE_RECORD, isProcessing: true };

    render(<GalleryCard image={processingImage} />);

    expect(screen.getAllByTestId("skeleton").length).toBe(3);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders formatted date and size", () => {
    const imageWithSize = { ...TEST_FILE_RECORD, size: 1234 };

    render(<GalleryCard image={imageWithSize} />);

    expect(screen.getByText((content) => content.includes("1 Jan 2024, 00:00 UTC"))).toBeDefined();
    expect(screen.getByText((content) => content.includes("1234 B"))).toBeDefined();
  });

  it("renders date without size when size is null", () => {
    const imageNoSize = { ...TEST_FILE_RECORD, size: null };

    render(<GalleryCard image={imageNoSize} />);

    expect(screen.getByText("1 Jan 2024, 00:00 UTC")).toBeDefined();
  });

  it.each([
    ["click", () => fireEvent.click(screen.getByRole("button"))],
    ["Enter keydown", () => fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" })],
    ["Space keydown", () => fireEvent.keyDown(screen.getByRole("button"), { key: " " })],
  ])("navigates to gallery detail on %s", (_, action) => {
    render(<GalleryCard image={TEST_FILE_RECORD_WITH_RENDER} />);

    action();

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/gallery/$imageId",
      params: { imageId: "file-1" },
    });
  });
});
