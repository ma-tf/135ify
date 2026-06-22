import type { FileWithState } from "@stores/file-store-types";

import { FileProvider } from "@features/process/file-context";
import { PreviewDialog } from "@features/process/preview-dialog";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(cleanup);

beforeEach(() => {
  vi.stubGlobal("URL", { ...URL, revokeObjectURL: vi.fn() });
});

const TEST_FILE: FileWithState = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

function renderDialog(inspectUrl: string | null = null) {
  useFileStore.setState({ files: [TEST_FILE] });
  useEditSheetStore.setState({
    openSheetId: null,
    imageSrc: "",
    showOriginal: {},
    inspectUrl,
  });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={TEST_FILE.id}>
        <PreviewDialog />
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("PreviewDialog", () => {
  it("renders nothing when inspectUrl is null", () => {
    renderDialog(null);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders image with correct src when inspectUrl is set", () => {
    renderDialog("blob:inspect-url");
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:inspect-url");
  });

  it("renders image alt from file name", () => {
    renderDialog("blob:inspect-url");
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toBe("test.jpg");
  });

  it("close button calls setInspectUrl(null)", () => {
    renderDialog("blob:inspect-url");
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(useEditSheetStore.getState().inspectUrl).toBeNull();
  });
});
