import { useCallback, useRef, type ChangeEvent, type InputHTMLAttributes } from "react";

export type FileInputOptions = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

export type FileInputActions = {
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function useFileInput(options: FileInputOptions): FileInputActions {
  const { accept = "*", multiple = true, onFiles } = options;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(Array.from(e.target.files));
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFiles],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        ...props,
        type: "file" as const,
        onChange: handleFileChange,
        accept: props.accept || accept,
        multiple: props.multiple !== undefined ? props.multiple : multiple,
        ref: inputRef,
      };
    },
    [accept, multiple, handleFileChange],
  );

  return { openFileDialog, getInputProps, handleFileChange };
}
