import { FileProvider } from "@features/process/file-context";
import { RenderCard } from "@features/process/render-card";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { TEST_FILE, TEST_FILE_WITH_RENDER } from "@test-utils/test-fixtures.spec";
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
  function renderCard(file = TEST_FILE) {
    useFileStore.setState({ files: [file] });
    useEditSheetStore.setState({
      openSheetId: null,
      imageSrc: "",
      showOriginal: {},
      inspectUrl: null,
    });

    return render(
      <FileProvider fileId={file.id}>
        <RenderCard />
      </FileProvider>,
    );
  }

  it("renders image with preview when renderUrl is null", () => {
    renderCard();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(TEST_FILE.preview);
  });

  it("renders image with renderUrl when available", () => {
    renderCard(TEST_FILE_WITH_RENDER);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(TEST_FILE_WITH_RENDER.renderUrl);
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
    expect(useEditSheetStore.getState().openSheetId).toBe(TEST_FILE.id);
  });

  it("renders EditSheet and PreviewDialog", () => {
    renderCard();
    expect(screen.getByTestId("edit-sheet")).toBeDefined();
    expect(screen.getByTestId("preview-dialog")).toBeDefined();
  });

  it("applies custom className", () => {
    render(
      <FileProvider fileId={TEST_FILE.id}>
        <RenderCard className="my-custom-class" />
      </FileProvider>,
    );
    const card = screen.getByRole("img").parentElement!;
    expect(card.className).toContain("my-custom-class");
  });
});
