import { FileProvider } from "@features/process/file-context";
import { RenderCard } from "@features/process/render-card";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { useRenderStateStore } from "@stores/render-state-store";
import { TEST_FILE_RECORD, TEST_RENDER_STATE_WITH_URL } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/edit-sheet", () => ({
  EditSheet: () => <div data-testid="edit-sheet" />,
}));

vi.mock("@features/process/preview-dialog", () => ({
  PreviewDialog: () => <div data-testid="preview-dialog" />,
}));

afterEach(cleanup);

describe("RenderCard", () => {
  function renderCard(withRenderState = false) {
    useFileStore.setState({ files: [TEST_FILE_RECORD] });
    useRenderStateStore.setState({
      states: withRenderState ? { [TEST_FILE_RECORD.id]: TEST_RENDER_STATE_WITH_URL } : {},
    });
    useEditSheetStore.setState({
      openSheetId: null,
      imageSrc: "",
      showOriginal: {},
      inspectUrl: null,
    });

    return render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD.id}>
          <RenderCard />
        </FileProvider>
      </TestStorageProvider>,
    );
  }

  it("renders image with sourceUrl when renderUrl is null", () => {
    renderCard();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(TEST_FILE_RECORD.sourceUrl);
  });

  it("renders image with renderUrl when available", () => {
    renderCard(true);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(TEST_RENDER_STATE_WITH_URL.renderUrl);
  });

  it("shows loading placeholder before image loads", () => {
    renderCard();
    expect(screen.getByRole("img").className).toContain("opacity-0");
  });

  it("hides loading placeholder after image loads", () => {
    renderCard();
    fireEvent.load(screen.getByRole("img"));
    expect(screen.getByRole("img").className).toContain("opacity-100");
  });

  it("click opens the edit sheet", () => {
    renderCard();
    const card = screen.getByRole("img").parentElement!;
    fireEvent.click(card);
    expect(useEditSheetStore.getState().openSheetId).toBe(TEST_FILE_RECORD.id);
  });

  it("renders EditSheet and PreviewDialog", () => {
    renderCard();
    expect(screen.getByTestId("edit-sheet")).toBeDefined();
    expect(screen.getByTestId("preview-dialog")).toBeDefined();
  });

  it("applies custom className", () => {
    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD.id}>
          <RenderCard className="my-custom-class" />
        </FileProvider>
      </TestStorageProvider>,
    );
    const card = screen.getByRole("img").parentElement!;
    expect(card.className).toContain("my-custom-class");
  });
});
