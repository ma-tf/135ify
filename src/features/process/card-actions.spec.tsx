import type { FileWithState } from "@stores/file-store";

import { ActiveCardProvider } from "@features/process/active-card-context";
import { CardActions } from "@features/process/card-actions";
import { FileProvider } from "@features/process/file-context";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(cleanup);

const TEST_FILE: FileWithState = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: {
    vignetteIntensity: 0,
    vignetteFeather: 0,
    halationIntensity: 0,
    halationSpread: 0,
    halationThreshold: 0,
    grainIntensity: 0,
    selectedFilmId: "none",
  },
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

function setupStore() {
  useFileStore.setState({ files: [TEST_FILE] });
  useEditSheetStore.setState({
    openSheetId: null,
    imageSrc: "",
    showOriginal: {},
    inspectUrl: null,
  });
}

describe("CardActions", () => {
  beforeEach(() => {
    setupStore();
  });

  function renderCardActions() {
    return render(
      <ActiveCardProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <CardActions />
        </FileProvider>
      </ActiveCardProvider>,
    );
  }

  it("edit button calls setOpenSheetId with file id", () => {
    renderCardActions();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    expect(useEditSheetStore.getState().openSheetId).toBe(TEST_FILE.id);
  });

  it("delete button removes file from store", () => {
    const mockRevokeFileUrls = vi.fn();
    const mockSetFiles = vi.fn();
    useFileStore.setState({
      revokeFileUrls: mockRevokeFileUrls,
      setFiles: mockSetFiles,
    });

    renderCardActions();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    expect(mockRevokeFileUrls).toHaveBeenCalledWith(TEST_FILE.id);
    expect(mockSetFiles).toHaveBeenCalled();
    const updatedFiles = mockSetFiles.mock.calls[0][0] as FileWithState[];
    expect(updatedFiles.find((f) => f.id === TEST_FILE.id)).toBeUndefined();
  });
});
