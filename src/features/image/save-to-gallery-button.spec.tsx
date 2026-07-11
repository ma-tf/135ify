import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { SaveToGalleryButton } from "@features/image/save-to-gallery-button";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseAuth, mockUseFile, mockSaveToGallery, mockUseQuery } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(() => ({ isAuthenticated: true })),
  mockUseFile: vi.fn(() => TEST_FILE_RECORD),
  mockSaveToGallery: vi.fn(() => ({ save: vi.fn(), isSaving: false })),
  mockUseQuery: vi.fn(() => ({ status: "success", data: { atLimit: false } })),
}));

vi.mock("@hooks/use-auth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: mockUseFile,
}));

vi.mock("@features/gallery/use-save-to-gallery", () => ({
  useSaveToGallery: mockSaveToGallery,
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: { images: { getStorageUsage: "getStorageUsage" } },
}));

vi.mock("@components/ui/button", () => ({
  Button: ({ children, disabled, onClick, className }: any) => (
    <button disabled={disabled} onClick={onClick} className={className} type="button">
      {children}
    </button>
  ),
}));

vi.mock("@components/ui/spinner", () => ({
  Spinner: ({ className }: any) => <div data-testid="spinner" className={className} />,
}));

vi.mock("lucide-react", () => ({
  ImagePlusIcon: () => <div data-testid="image-plus-icon" />,
}));

setupTests();

const mockSave = vi.fn();
const mockOnClose = vi.fn();

function renderButton() {
  useFileStore.setState({ files: [TEST_FILE_RECORD] });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={TEST_FILE_RECORD.id}>
        <EditViewCloseProvider onClose={mockOnClose}>
          <SaveToGalleryButton />
        </EditViewCloseProvider>
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("SaveToGalleryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseFile.mockReturnValue(TEST_FILE_RECORD);
    mockUseQuery.mockReturnValue({ status: "success", data: { atLimit: false } });
    mockSaveToGallery.mockReturnValue({ save: mockSave, isSaving: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders button when authenticated", () => {
    renderButton();
    expect(screen.getByText("Save to Gallery")).toBeDefined();
  });

  it("returns null when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { container } = renderButton();
    expect(container.innerHTML).toBe("");
  });

  it("returns null when file already has convexId", () => {
    mockUseFile.mockReturnValue({ ...TEST_FILE_RECORD, convexId: "convex-123" });

    const { container } = renderButton();
    expect(container.innerHTML).toBe("");
  });

  it("disables button when at limit", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: { atLimit: true } });

    renderButton();
    expect(screen.getByText("Save to Gallery").getAttribute("disabled")).toBe("");
  });

  it("disables button when file is processing", () => {
    mockUseFile.mockReturnValue({ ...TEST_FILE_RECORD, isProcessing: true });

    renderButton();
    expect(screen.getByText("Save to Gallery").getAttribute("disabled")).toBe("");
  });

  it("shows spinner when saving", () => {
    mockSaveToGallery.mockReturnValue({ save: mockSave, isSaving: true });

    renderButton();
    expect(screen.getByTestId("spinner")).toBeDefined();
    expect(screen.queryByTestId("image-plus-icon")).toBeNull();
  });

  it("shows icon when not saving", () => {
    renderButton();
    expect(screen.getByTestId("image-plus-icon")).toBeDefined();
    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  it("calls save on click", () => {
    renderButton();
    fireEvent.click(screen.getByText("Save to Gallery"));
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it("disables button when saving", () => {
    mockSaveToGallery.mockReturnValue({ save: mockSave, isSaving: true });

    renderButton();
    expect(screen.getByText("Save to Gallery").getAttribute("disabled")).toBe("");
  });
});
