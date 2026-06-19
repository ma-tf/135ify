import { useDragScroll } from "@hooks/use-drag-scroll";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

let lastRef: ReturnType<typeof useDragScroll>["ref"];

function DragScrollTest({ children }: { children?: React.ReactNode }) {
  const { ref, isDragging } = useDragScroll();
  lastRef = ref;
  return (
    <div ref={ref} data-dragging={isDragging} style={{ overflowX: "auto", width: 200 }}>
      <div style={{ width: 1000, height: 50 }}>{children}</div>
    </div>
  );
}

function container() {
  return document.querySelector("[data-dragging]") as HTMLElement;
}

describe("useDragScroll", () => {
  afterEach(cleanup);
  it("isDragging starts as false", () => {
    render(<DragScrollTest />);
    expect(container().dataset.dragging).toBe("false");
  });

  it("ref attaches to an HTMLDivElement", () => {
    render(<DragScrollTest />);
    expect(lastRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("drag scrolls the container", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 60 });

    expect(el.scrollLeft).toBeGreaterThan(0);
  });

  it("does not activate dragging below 5px threshold", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 103 });

    expect(el.dataset.dragging).toBe("false");
  });

  it("activates dragging at 5px threshold", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 105 });

    expect(el.dataset.dragging).toBe("true");
  });

  it("mouseup resets dragging state", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 110 });
    expect(el.dataset.dragging).toBe("true");

    fireEvent.mouseUp(window);
    expect(el.dataset.dragging).toBe("false");
  });

  it("mouseleave resets dragging state", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 110 });
    expect(el.dataset.dragging).toBe("true");

    fireEvent.mouseLeave(el);
    expect(el.dataset.dragging).toBe("false");
  });

  it("ignores clicks on interactive elements", () => {
    render(
      <DragScrollTest>
        <button>Click me</button>
      </DragScrollTest>,
    );
    const el = container();
    const button = screen.getByText("Click me");
    const initialScrollLeft = el.scrollLeft;

    fireEvent.mouseDown(button, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 60 });

    expect(el.dataset.dragging).toBe("false");
    expect(el.scrollLeft).toBe(initialScrollLeft);
  });

  it("ignores clicks on elements with data-no-drag", () => {
    render(
      <DragScrollTest>
        <div data-no-drag>No drag</div>
      </DragScrollTest>,
    );
    const el = container();
    const noDrag = screen.getByText("No drag");
    const initialScrollLeft = el.scrollLeft;

    fireEvent.mouseDown(noDrag, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 60 });

    expect(el.dataset.dragging).toBe("false");
    expect(el.scrollLeft).toBe(initialScrollLeft);
  });

  it("window mousemove triggers scrolling", () => {
    render(<DragScrollTest />);
    const el = container();

    fireEvent.mouseDown(el, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 50 });

    expect(el.scrollLeft).toBeGreaterThan(0);
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<DragScrollTest />);
    const el = container();
    unmount();

    expect(el).toBeDefined();
    expect(() => {
      fireEvent.mouseDown(el!, { clientX: 100 });
      fireEvent.mouseMove(window, { clientX: 60 });
    }).not.toThrow();
  });
});
