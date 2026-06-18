import { useCallback, useState, type DragEvent } from "react";

export type DragDropOptions = {
  onDrop?: (files: File[]) => void;
  disabled?: boolean;
};

export type DragDropState = {
  isDragging: boolean;
};

export type DragDropActions = {
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  resetDragging: () => void;
};

export function useDragDrop(options: DragDropOptions = {}): [DragDropState, DragDropActions] {
  const { onDrop = () => {}, disabled = false } = options;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDrop(Array.from(e.dataTransfer.files));
      }
    },
    [disabled, onDrop],
  );

  const resetDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  return [
    { isDragging },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, resetDragging },
  ];
}
