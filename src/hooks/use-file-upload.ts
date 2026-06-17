import type { FileWithState } from "@stores/file-store";

import { prepareFiles } from "@features/process/prepare-files";
import { useDragDrop } from "@hooks/use-drag-drop";
import { useFileInput } from "@hooks/use-file-input";
import { useStorage } from "@providers/storage-context";
import { useCallback, useState, type InputHTMLAttributes } from "react";

export type FileUploadOptions = {
  maxSize?: number;
  accept?: string;
  onFilesChange?: (files: FileWithState[]) => void;
  onFilesAdded?: (addedFiles: FileWithState[]) => void;
};

export type FileUploadState = {
  files: FileWithState[];
  isDragging: boolean;
  errors: string[];
};

export type FileUploadActions = {
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
  resetDragging: () => void;
};

export const useFileUpload = (
  options: FileUploadOptions = {},
): [FileUploadState, FileUploadActions] => {
  const { onFilesChange, onFilesAdded } = options;

  const { files: storeFiles, setFiles } = useStorage();
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (!newFiles || newFiles.length === 0) return;

      setErrors([]);

      const { valid, errors: prepErrors } = prepareFiles(newFiles);

      if (valid.length > 0) {
        onFilesAdded?.(valid);

        const newFilesResult = [...valid, ...storeFiles];
        setFiles(newFilesResult);
        onFilesChange?.(newFilesResult);
        setErrors(prepErrors);
      } else if (prepErrors.length > 0) {
        setErrors(prepErrors);
      }
    },
    [storeFiles, onFilesChange, onFilesAdded, setFiles],
  );

  const [dragState, dragActions] = useDragDrop({
    onDrop: addFiles,
  });

  const fileInputActions = useFileInput({
    accept: options.accept,
    onFiles: addFiles,
  });

  const clearFiles = useCallback(() => {
    for (const file of storeFiles) {
      if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
        URL.revokeObjectURL(file.preview);
      }
    }

    setFiles([]);
    setErrors([]);
    onFilesChange?.([]);
  }, [storeFiles, onFilesChange, setFiles]);

  const removeFile = useCallback(
    (id: string) => {
      const fileToRemove = storeFiles.find((file) => file.id === id);
      if (
        fileToRemove &&
        fileToRemove.preview &&
        fileToRemove.file instanceof File &&
        fileToRemove.file.type.startsWith("image/")
      ) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      const newFiles = storeFiles.filter((file) => file.id !== id);
      setFiles(newFiles);
      setErrors([]);
      onFilesChange?.(newFiles);
    },
    [storeFiles, onFilesChange, setFiles],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return [
    { files: storeFiles, isDragging: dragState.isDragging, errors },
    {
      addFiles: (files: FileList | File[]) => addFiles(Array.from(files)),
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter: dragActions.handleDragEnter,
      handleDragLeave: dragActions.handleDragLeave,
      handleDragOver: dragActions.handleDragOver,
      handleDrop: dragActions.handleDrop,
      handleFileChange: fileInputActions.handleFileChange,
      openFileDialog: fileInputActions.openFileDialog,
      getInputProps: fileInputActions.getInputProps,
      resetDragging: dragActions.resetDragging,
    },
  ];
};
