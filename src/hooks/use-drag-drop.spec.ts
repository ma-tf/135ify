import { useDragDrop } from "@hooks/use-drag-drop";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeDragEvent(
  overrides: Partial<{
    preventDefault: ReturnType<typeof vi.fn>;
    stopPropagation: ReturnType<typeof vi.fn>;
    dataTransfer: { files: File[] };
    currentTarget: HTMLElement;
    relatedTarget: Node | null;
  }> = {},
) {
  return {
    preventDefault: overrides.preventDefault ?? vi.fn(),
    stopPropagation: overrides.stopPropagation ?? vi.fn(),
    dataTransfer: { files: [] },
    currentTarget: document.createElement("div"),
    relatedTarget: null,
    ...overrides,
  } as unknown as import("react").DragEvent<HTMLElement>;
}

describe("useDragDrop", () => {
  it("isDragging starts as false", () => {
    const { result } = renderHook(() => useDragDrop());
    expect(result.current[0].isDragging).toBe(false);
  });

  it("handleDragEnter sets isDragging to true", () => {
    const { result } = renderHook(() => useDragDrop());
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const e = makeDragEvent({ preventDefault, stopPropagation });

    act(() => result.current[1].handleDragEnter(e));

    expect(result.current[0].isDragging).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it("handleDragLeave sets isDragging to false when relatedTarget is not a child", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => result.current[1].handleDragEnter(makeDragEvent()));
    expect(result.current[0].isDragging).toBe(true);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const leaveEvent = makeDragEvent({
      preventDefault,
      stopPropagation,
      relatedTarget: document.createElement("span"),
    });

    act(() => result.current[1].handleDragLeave(leaveEvent));

    expect(result.current[0].isDragging).toBe(false);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it("handleDragLeave does not reset isDragging when relatedTarget is a child", () => {
    const { result } = renderHook(() => useDragDrop());
    const currentTarget = document.createElement("div");
    const child = document.createElement("span");
    currentTarget.appendChild(child);

    act(() => result.current[1].handleDragEnter(makeDragEvent({ currentTarget })));
    expect(result.current[0].isDragging).toBe(true);

    act(() =>
      result.current[1].handleDragLeave(makeDragEvent({ currentTarget, relatedTarget: child })),
    );

    expect(result.current[0].isDragging).toBe(true);
  });

  it("handleDragOver calls preventDefault and stopPropagation without changing isDragging", () => {
    const { result } = renderHook(() => useDragDrop());
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const e = makeDragEvent({ preventDefault, stopPropagation });

    act(() => result.current[1].handleDragOver(e));

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(result.current[0].isDragging).toBe(false);
  });

  it("handleDrop resets isDragging and calls onDrop with files", () => {
    const onDrop = vi.fn();
    const file = new File(["content"], "test.png", { type: "image/png" });
    const { result } = renderHook(() => useDragDrop({ onDrop }));

    act(() => result.current[1].handleDragEnter(makeDragEvent()));
    expect(result.current[0].isDragging).toBe(true);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const dropEvent = makeDragEvent({
      preventDefault,
      stopPropagation,
      dataTransfer: { files: [file] },
    });

    act(() => result.current[1].handleDrop(dropEvent));

    expect(result.current[0].isDragging).toBe(false);
    expect(onDrop).toHaveBeenCalledWith([file]);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it("handleDrop does not call onDrop when files are empty", () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDragDrop({ onDrop }));

    act(() => result.current[1].handleDrop(makeDragEvent()));

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("handleDrop does not call onDrop when disabled", () => {
    const onDrop = vi.fn();
    const file = new File(["content"], "test.png", { type: "image/png" });
    const { result } = renderHook(() => useDragDrop({ onDrop, disabled: true }));

    act(() => result.current[1].handleDrop(makeDragEvent({ dataTransfer: { files: [file] } })));

    expect(onDrop).not.toHaveBeenCalled();
    expect(result.current[0].isDragging).toBe(false);
  });

  it("handleDrop does not throw when onDrop is omitted", () => {
    const { result } = renderHook(() => useDragDrop());

    expect(() =>
      act(() =>
        result.current[1].handleDrop(
          makeDragEvent({
            dataTransfer: {
              files: [new File(["a"], "a.txt", { type: "text/plain" })],
            },
          }),
        ),
      ),
    ).not.toThrow();
  });

  it("resetDragging sets isDragging to false", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => result.current[1].handleDragEnter(makeDragEvent()));
    expect(result.current[0].isDragging).toBe(true);

    act(() => result.current[1].resetDragging());

    expect(result.current[0].isDragging).toBe(false);
  });

  it("returned action callbacks are referentially stable", () => {
    const onDrop = vi.fn();
    const { result, rerender } = renderHook(() => useDragDrop({ onDrop }));

    const actionsBefore = result.current[1];
    rerender();
    const actionsAfter = result.current[1];

    expect(actionsAfter.handleDragEnter).toBe(actionsBefore.handleDragEnter);
    expect(actionsAfter.handleDragLeave).toBe(actionsBefore.handleDragLeave);
    expect(actionsAfter.handleDragOver).toBe(actionsBefore.handleDragOver);
    expect(actionsAfter.handleDrop).toBe(actionsBefore.handleDrop);
    expect(actionsAfter.resetDragging).toBe(actionsBefore.resetDragging);
  });
});
