import type { FileMetadata, FileWithState } from "@stores/file-store";

import { prepareFiles } from "@features/process/prepare-files";
import { useFileStore } from "@stores/file-store";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from "react";

export type FileUploadOptions = {
  maxFiles?: number; // Only used when multiple is true, defaults to Infinity
  maxSize?: number; // in bytes
  accept?: string;
  multiple?: boolean; // Defaults to false
  initialFiles?: FileMetadata[];
  onFilesChange?: (files: FileWithState[]) => void; // Callback when files change
  onFilesAdded?: (addedFiles: FileWithState[]) => void; // Callback when new files are added
  onError?: (errors: string[]) => void;
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
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    multiple = false,
    onFilesChange,
    onFilesAdded,
    onError,
  } = options;

  const storeFiles = useFileStore((s) => s.files);
  const setStoreFiles = useFileStore((s) => s.setFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const clearFiles = useCallback(() => {
    for (const file of storeFiles) {
      if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
        URL.revokeObjectURL(file.preview);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setStoreFiles([]);
    setErrors([]);
    onFilesChange?.([]);
  }, [storeFiles, onFilesChange, setStoreFiles]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      if (!newFiles || newFiles.length === 0) return;

      const newFilesArray = Array.from(newFiles);

      setErrors([]);

      if (!multiple) {
        clearFiles();
      }

      if (
        multiple &&
        maxFiles !== Number.POSITIVE_INFINITY &&
        storeFiles.length + newFilesArray.length > maxFiles
      ) {
        const newErrors = [`You can only upload a maximum of ${maxFiles} files.`];
        onError?.(newErrors);
        setErrors(newErrors);
        return;
      }

      const { valid, errors: prepErrors } = prepareFiles(newFilesArray);

      if (valid.length > 0) {
        onFilesAdded?.(valid);

        const newFilesResult = !multiple ? valid : [...valid, ...storeFiles];
        setStoreFiles(newFilesResult);
        onFilesChange?.(newFilesResult);
        setErrors(prepErrors);
      } else if (prepErrors.length > 0) {
        onError?.(prepErrors);
        setErrors(prepErrors);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [
      storeFiles,
      maxFiles,
      multiple,
      clearFiles,
      onFilesChange,
      onFilesAdded,
      onError,
      setStoreFiles,
    ],
  );

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
      setStoreFiles(newFiles);
      setErrors([]);
      onFilesChange?.(newFiles);
    },
    [storeFiles, onFilesChange, setStoreFiles],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

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

      if (inputRef.current?.disabled) {
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (!multiple) {
          const file = e.dataTransfer.files[0];
          addFiles([file]);
        } else {
          addFiles(e.dataTransfer.files);
        }
      }
    },
    [addFiles, multiple],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        ...props,
        type: "file" as const,
        onChange: handleFileChange,
        accept: props.accept || "*",
        multiple: props.multiple !== undefined ? props.multiple : multiple,
        ref: inputRef,
      };
    },
    [multiple, handleFileChange],
  );

  const resetDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  return [
    { files: storeFiles, isDragging, errors },
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps,
      resetDragging,
    },
  ];
};
