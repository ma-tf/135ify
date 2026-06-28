import { CardClickProvider } from "@features/process/card-click-context";
import { RenderCard } from "@features/process/render-card";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { TEST_FILE_RECORD, TEST_FILE_RECORD_WITH_RENDER } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mockCardClick = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RenderCard", () => {
  function renderCard(withRenderState = false) {
    useFileStore.setState({
      files: [withRenderState ? TEST_FILE_RECORD_WITH_RENDER : TEST_FILE_RECORD],
    });

    return render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD.id}>
          <CardClickProvider onCardClick={mockCardClick}>
            <RenderCard />
          </CardClickProvider>
        </FileProvider>
      </TestStorageProvider>,
    );
  }

  it("renders image with sourceUrl when renderUrl is null", () => {
    renderCard();
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("renders image with renderUrl when available", () => {
    renderCard(true);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(TEST_FILE_RECORD_WITH_RENDER.renderUrl);
  });

  it("shows loading placeholder before image loads", () => {
    renderCard(true);
    expect(screen.getByRole("img").className).toContain("opacity-0");
  });

  it("hides loading placeholder after image loads", () => {
    renderCard(true);
    fireEvent.load(screen.getByRole("img"));
    expect(screen.getByRole("img").className).toContain("opacity-100");
  });

  it("click calls onCardClick with file id", () => {
    renderCard(true);
    const card = screen.getByRole("img").parentElement!;
    fireEvent.click(card);
    expect(mockCardClick).toHaveBeenCalledWith(TEST_FILE_RECORD_WITH_RENDER.id);
  });

  it("applies custom className", () => {
    useFileStore.setState({
      files: [TEST_FILE_RECORD_WITH_RENDER],
    });
    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD_WITH_RENDER.id}>
          <CardClickProvider onCardClick={mockCardClick}>
            <RenderCard className="my-custom-class" />
          </CardClickProvider>
        </FileProvider>
      </TestStorageProvider>,
    );
    const card = screen.getByRole("img").parentElement!;
    expect(card.className).toContain("my-custom-class");
  });
});
