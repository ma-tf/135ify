import { ActiveCardProvider } from "@features/process/active-card-context";
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
      <ActiveCardProvider>
        <FileProvider fileId={file.id}>
          <RenderCard />
        </FileProvider>
      </ActiveCardProvider>,
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

  it("click activates the card", () => {
    renderCard();
    const card = screen.getByRole("img").parentElement!;
    fireEvent.click(card);
    const overlay = card.querySelector("[class*='bg-black']");
    expect(overlay!.className).toContain("opacity-100");
  });

  it("click deactivates the card when already active", () => {
    renderCard();
    const card = screen.getByRole("img").parentElement!;
    fireEvent.click(card);
    fireEvent.click(card);
    const overlay = card.querySelector("[class*='bg-black']");
    expect(overlay!.className).toContain("opacity-0");
  });

  it("click does nothing when edit sheet is open for this card", () => {
    useFileStore.setState({ files: [TEST_FILE] });
    useEditSheetStore.setState({
      openSheetId: TEST_FILE.id,
      imageSrc: "",
      showOriginal: {},
      inspectUrl: null,
    });

    render(
      <ActiveCardProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <RenderCard />
        </FileProvider>
      </ActiveCardProvider>,
    );

    const card = screen.getByRole("img").parentElement!;
    const overlay = card.querySelector("[class*='bg-black']");
    expect(overlay!.className).toContain("opacity-0");

    fireEvent.click(card);
    expect(overlay!.className).toContain("opacity-0");
  });

  it("overlay is hidden when card is not active", () => {
    renderCard();
    const card = screen.getByRole("img").parentElement!;
    const overlay = card.querySelector("[class*='bg-black']");
    expect(overlay!.className).toContain("opacity-0");
  });

  it("renders CardActions", () => {
    renderCard();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(3);
  });

  it("renders EditSheet and PreviewDialog", () => {
    renderCard();
    expect(screen.getByTestId("edit-sheet")).toBeDefined();
    expect(screen.getByTestId("preview-dialog")).toBeDefined();
  });

  it("applies custom className", () => {
    render(
      <ActiveCardProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <RenderCard className="my-custom-class" />
        </FileProvider>
      </ActiveCardProvider>,
    );
    const card = screen.getByRole("img").parentElement!;
    expect(card.className).toContain("my-custom-class");
  });
});
