import { OverQuotaDialog } from "@components/over-quota-dialog";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const TEST_URL = "https://example.com/over-quota-image.jpg";
const TEST_BLOB = new Blob(["test-image-data"], { type: "image/jpeg" });

describe("OverQuotaDialog", () => {
  const onDiscard = vi.fn();
  const mockFetch = vi.fn();
  const mockCreateObjectURL = vi.fn(() => "blob:test-url");

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      blob: () => Promise.resolve(TEST_BLOB),
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL);
    });
    expect(mockCreateObjectURL).toHaveBeenCalledWith(TEST_BLOB);
  });
});
