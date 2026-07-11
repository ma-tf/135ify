import { OverQuotaDialog } from "@components/over-quota-dialog";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <>{children}</>,
  AlertDialogContent: ({ children }: any) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
}));

const TEST_URL = "https://example.com/over-quota-image.jpg";
const TEST_BLOB = new Blob(["test-image-data"], { type: "image/jpeg" });

const { mockFetch, mockCreateObjectURL } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockCreateObjectURL: vi.fn(() => "blob:test-url"),
}));

let originalFetch: typeof globalThis.fetch;
let originalUrl: typeof globalThis.URL;

describe("OverQuotaDialog", () => {
  const onDiscard = vi.fn();

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalUrl = globalThis.URL;
    mockFetch.mockResolvedValue({
      blob: () => Promise.resolve(TEST_BLOB),
      ok: true,
    });
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    globalThis.URL = {
      ...originalUrl,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: vi.fn(),
    } as unknown as typeof globalThis.URL;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    globalThis.URL = originalUrl;
  });

  it("renders the preview image with the download URL", () => {
    render(<OverQuotaDialog downloadUrl={TEST_URL} onDiscard={onDiscard} />);
    const img = screen.getByAltText("AI generated preview");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe(TEST_URL);
  });

  it("calls onDiscard when Discard is clicked", () => {
    render(<OverQuotaDialog downloadUrl={TEST_URL} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText("Discard"));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("fetches the image and creates a blob URL when Download now is clicked", async () => {
    render(<OverQuotaDialog downloadUrl={TEST_URL} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText("Download now"));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(TEST_BLOB);
    });
  });
});
