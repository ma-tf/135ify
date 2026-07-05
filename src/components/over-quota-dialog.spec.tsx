import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { OverQuotaDialog } from "./over-quota-dialog";

const TEST_BASE64 = "dGVzdC1pbWFnZS1kYXRh";

describe("OverQuotaDialog", () => {
  const onDiscard = vi.fn();
  const mockCreateObjectURL = vi.fn(() => "blob:test-url");

  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the preview image", () => {
    render(<OverQuotaDialog base64={TEST_BASE64} onDiscard={onDiscard} />);
    const img = screen.getByAltText("AI generated preview");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe(`data:image/jpeg;base64,${TEST_BASE64}`);
  });

  it("calls onDiscard when Discard is clicked", () => {
    render(<OverQuotaDialog base64={TEST_BASE64} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText("Discard"));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("creates a blob URL when Download now is clicked", () => {
    render(<OverQuotaDialog base64={TEST_BASE64} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText("Download now"));
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });
});
