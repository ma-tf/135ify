import { useCallback, useEffect, useRef, useState } from "react";

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    isDragging: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [role='button'], [data-no-drag]")) return;

    state.current.isDown = true;
    state.current.startX = e.clientX;
    state.current.scrollLeft = ref.current?.scrollLeft ?? 0;
    state.current.isDragging = false;
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!state.current.isDown) return;
    e.preventDefault();

    const walk = e.clientX - state.current.startX;

    if (!state.current.isDragging) {
      if (Math.abs(walk) < 5) return;
      state.current.isDragging = true;
      setIsDragging(true);
    }

    ref.current!.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  const stopDragging = useCallback(() => {
    state.current.isDown = false;
    if (state.current.isDragging) {
      state.current.isDragging = false;
      setIsDragging(false);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
    el.addEventListener("mouseleave", stopDragging);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      el.removeEventListener("mouseleave", stopDragging);
    };
  }, [onMouseDown, onMouseMove, stopDragging]);

  return { ref, isDragging };
}
