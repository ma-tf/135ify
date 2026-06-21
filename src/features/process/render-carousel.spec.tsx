import type { FileWithState } from "@stores/file-store";

import { RenderCarousel } from "@features/process/render-carousel";
import { useFileStore } from "@stores/file-store";
import { TEST_FILE, TEST_FILE_2 } from "@test-utils/test-fixtures.spec";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@hooks/use-drag-scroll", () => ({
  useDragScroll: vi.fn(() => ({
    ref: { current: null },
    isDragging: false,
  })),
}));

vi.mock("@features/process/dropzone", () => ({
  Dropzone: () => <div data-testid="dropzone" />,
}));

vi.mock("@features/process/render-card", () => ({
  RenderCard: () => <div data-testid="render-card" />,
}));

afterEach(cleanup);

function renderCarousel(files: FileWithState[] = []) {
  useFileStore.setState({ files });
  return render(<RenderCarousel />);
}

describe("RenderCarousel", () => {
  it("renders container with id render-carousel", () => {
    renderCarousel();
    expect(document.getElementById("render-carousel")).toBeDefined();
  });

  it("renders Dropzone as the first frame", () => {
    renderCarousel();
    const dropzone = screen.getByTestId("dropzone");
    const container = document.getElementById("render-carousel")!;
    expect(container.firstElementChild).toBe(dropzone.parentElement);
  });

  it("renders zero RenderCard components when store is empty", () => {
    renderCarousel([]);
    expect(screen.queryAllByTestId("render-card")).toHaveLength(0);
  });

  it("renders one RenderCard per file in the store", () => {
    renderCarousel([TEST_FILE, TEST_FILE_2]);
    expect(screen.getAllByTestId("render-card")).toHaveLength(2);
  });

  it("wraps each card frame in FileProvider with correct fileId", () => {
    renderCarousel([TEST_FILE, TEST_FILE_2]);
    const cards = screen.getAllByTestId("render-card");
    expect(cards[0].closest("[data-file-id]")).toBeNull();
    expect(useFileStore.getState().files).toHaveLength(2);
  });

  it("applies cursor-grab when not dragging", async () => {
    const { useDragScroll } = await import("@hooks/use-drag-scroll");
    vi.mocked(useDragScroll).mockReturnValue({
      ref: { current: null },
      isDragging: false,
    });
    renderCarousel();
    const container = document.getElementById("render-carousel")!;
    expect(container.className).toContain("cursor-grab");
  });

  it("applies cursor-grabbing when dragging", async () => {
    const { useDragScroll } = await import("@hooks/use-drag-scroll");
    vi.mocked(useDragScroll).mockReturnValue({
      ref: { current: null },
      isDragging: true,
    });
    renderCarousel();
    const container = document.getElementById("render-carousel")!;
    expect(container.className).toContain("cursor-grabbing");
  });

  it("renders frame number 0 on dropzone", () => {
    renderCarousel();
    const dropzone = screen.getByTestId("dropzone");
    const frameNumber = dropzone.parentElement!.querySelector("span");
    expect(frameNumber).toBeDefined();
    expect(frameNumber!.className).toContain("before:content-[counter(frame-counter)]");
  });
});
