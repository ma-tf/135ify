import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@config", () => ({
  BASE_PATH: "",
  FEATURE_AI_GRAIN: false,
  FEATURE_SIGN_IN: false,
  FEATURE_SUBSCRIPTIONS: false,
  FILE_SIZE_LIMIT_BYTES: 5 * 1024 * 1024,
  GRAIN_URL: "",
}));

vi.mock("@features/process/use-file-upload", () => ({
  useFileUpload: vi.fn(),
}));

import { Dropzone } from "@features/process/dropzone";
import { useFileUpload } from "@features/process/use-file-upload";

afterEach(cleanup);

const mockAddFiles = vi.fn();
const mockResetDragging = vi.fn();
const mockOpenFileDialog = vi.fn();

function stubUseFileUpload(
  overrides: Partial<ReturnType<typeof useFileUpload>[1]> = {},
  stateOverrides: Partial<ReturnType<typeof useFileUpload>[0]> = {},
) {
  (useFileUpload as ReturnType<typeof vi.fn>).mockReturnValue([
    { isDragging: false, errors: [] as string[], files: [], ...stateOverrides },
    {
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      openFileDialog: mockOpenFileDialog,
      getInputProps: () => ({ type: "file" as const, ref: { current: null } }),
      addFiles: mockAddFiles,
      resetDragging: mockResetDragging,
      removeFile: vi.fn(),
      clearErrors: vi.fn(),
      handleFileChange: vi.fn(),
      ...overrides,
    },
  ]);
}

describe("Dropzone", () => {
  it("renders the drop prompt when no errors", () => {
    stubUseFileUpload();
    render(<Dropzone />);

    expect(screen.getByText("Choose a file or drag & drop here.")).toBeDefined();
  });

  it("renders error state when errors exist", () => {
    stubUseFileUpload({}, { errors: ["File too large"] });
    render(<Dropzone />);

    expect(screen.getByText("File upload error(s)")).toBeDefined();
    expect(screen.getByText("File too large")).toBeDefined();
  });

  it("drop handler extracts only the first file", () => {
    stubUseFileUpload();
    render(<Dropzone />);

    const file1 = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const file2 = new File(["b"], "b.jpg", { type: "image/jpeg" });

    const dropTarget = screen.getByText("Choose a file or drag & drop here.").closest("div")!;
    fireEvent.drop(dropTarget, { dataTransfer: { files: [file1, file2] } });

    expect(mockAddFiles).toHaveBeenCalledWith([file1]);
    expect(mockAddFiles).not.toHaveBeenCalledWith([file1, file2]);
  });

  it("drop handler calls resetDragging", () => {
    stubUseFileUpload();
    render(<Dropzone />);

    const dropTarget = screen.getByText("Choose a file or drag & drop here.").closest("div")!;
    fireEvent.drop(dropTarget, {
      dataTransfer: { files: [new File(["a"], "a.jpg", { type: "image/jpeg" })] },
    });

    expect(mockResetDragging).toHaveBeenCalled();
  });

  it("click opens file dialog", () => {
    stubUseFileUpload();
    render(<Dropzone />);

    const dropzone = screen.getByText("Choose a file or drag & drop here.").closest("div")!;
    fireEvent.click(dropzone);

    expect(mockOpenFileDialog).toHaveBeenCalled();
  });

  it("shows formatted max size", () => {
    stubUseFileUpload();
    render(<Dropzone maxSize={5 * 1024 * 1024} />);

    expect(screen.getByText(/5MB/)).toBeDefined();
  });
});
