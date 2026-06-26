import type { FileRecord } from "@stores/file-store-types";

import { useDragDrop } from "@hooks/use-drag-drop";
import { useFileInput } from "@hooks/use-file-input";
import { useStorage } from "@providers/storage-context";
import { prepareFiles } from "@stores/prepare-files";
import { useCallback, useState, type InputHTMLAttributes } from "react";

export type FileUploadOptions = {
  maxSize?: number;
  accept?: string;
  onFilesChange?: (files: FileRecord[]) => void;
  onFilesAdded?: (addedFiles: FileRecord[]) => void;
};

export type FileUploadState = {
  files: FileRecord[];
  isDragging: boolean;
  errors: string[];
};

export type FileUploadActions = {
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
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
  const { onFilesChange = () => {}, onFilesAdded = () => {} } = options;

  const {
    files: storeFiles,
    addFiles: storageAddFiles,
    removeFile: storageRemoveFile,
  } = useStorage();
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (!newFiles.length) return;

      setErrors([]);

      const { valid, records, errors: prepErrors } = prepareFiles(newFiles);

      if (valid.length > 0) {
        onFilesAdded(records);
        storageAddFiles(valid);
        onFilesChange([...records, ...storeFiles]);
      }

      setErrors(prepErrors);
    },
    [storeFiles, onFilesChange, onFilesAdded, storageAddFiles],
  );

  const [dragState, dragActions] = useDragDrop({
    onDrop: addFiles,
  });

  const fileInputActions = useFileInput({
    accept: options.accept,
    onFiles: addFiles,
  });

  const removeFile = useCallback(
    (id: string) => {
      storageRemoveFile(id);
      setErrors([]);
      onFilesChange(storeFiles.filter((f) => f.id !== id));
    },
    [storeFiles, onFilesChange, storageRemoveFile],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return [
    { files: storeFiles, isDragging: dragState.isDragging, errors },
    {
      addFiles: (files: FileList | File[]) => addFiles(Array.from(files)),
      removeFile,
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
