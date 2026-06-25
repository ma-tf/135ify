import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { GalleryPage } from "./gallery-page";

const { mockUseConvexAuth, mockUseQuery, mockNavigate } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockUseQuery: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: mockUseConvexAuth,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
  useConvexAuth: mockUseConvexAuth,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockImage = {
  _id: "img123",
  _creationTime: Date.UTC(2026, 5, 16, 16, 1, 11),
  userId: "user1",
  sourceStorageId: "storage1" as any,
  fileName: "test-photo.jpg",
  params: DEFAULT_PARAMS,
  sourceUrl: "https://example.com/photo.jpg",
};

const mockImage2 = {
  _id: "img456",
  _creationTime: Date.UTC(2026, 5, 17, 10, 30, 0),
  userId: "user1",
  sourceStorageId: "storage2" as any,
  fileName: "another-shot.png",
  params: DEFAULT_PARAMS,
  sourceUrl: "https://example.com/photo2.jpg",
};

describe("GalleryPage", () => {
  it("shows empty state message when user has no saved images", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    render(<GalleryPage />);

    expect(screen.getByText(/no saved images/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /process/i })).toBeDefined();
  });

  it("renders a grid of image cards when images exist", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ status: "success", data: [mockImage, mockImage2] });

    render(<GalleryPage />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(mockImage.sourceUrl);
    expect(images[1].getAttribute("src")).toBe(mockImage2.sourceUrl);

    expect(screen.getByText(mockImage.fileName)).toBeDefined();
    expect(screen.getByText(mockImage2.fileName)).toBeDefined();

    const expectedDate =
      new Date(mockImage._creationTime).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }) + " UTC";
    expect(screen.getByText(expectedDate)).toBeDefined();
  });

  it("navigates to /gallery/$imageId when a card is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ status: "success", data: [mockImage] });

    render(<GalleryPage />);

    const card = screen.getByText(mockImage.fileName).closest('[class*="cursor-pointer"]')!;
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/gallery/$imageId",
      params: { imageId: mockImage._id },
    });
  });

  it("shows skeleton placeholders while query is pending", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ status: "pending", data: undefined });

    const { container } = render(<GalleryPage />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(8);
  });
});
