import { CardClickProvider } from "@features/process/card-click-context";
import { RenderCard } from "@features/process/render-card";
import { TEST_FILE_RECORD, TEST_FILE_RECORD_WITH_RENDER } from "@test-utils/test-fixtures.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseFileReturn } = vi.hoisted(() => ({
  mockUseFileReturn: { current: null as any },
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: () => mockUseFileReturn.current,
}));

const mockCardClick = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockUseFileReturn.current = null;
});

describe("RenderCard", () => {
  function renderCard(withRenderState = false) {
    mockUseFileReturn.current = withRenderState
      ? { ...TEST_FILE_RECORD_WITH_RENDER }
      : { ...TEST_FILE_RECORD };

    return render(
      <CardClickProvider onCardClick={mockCardClick}>
        <RenderCard />
      </CardClickProvider>,
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
    mockUseFileReturn.current = { ...TEST_FILE_RECORD_WITH_RENDER };
    render(
      <CardClickProvider onCardClick={mockCardClick}>
        <RenderCard className="my-custom-class" />
      </CardClickProvider>,
    );
    const card = screen.getByRole("img").parentElement!;
    expect(card.className).toContain("my-custom-class");
  });
});
