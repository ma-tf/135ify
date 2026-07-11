import { EditViewProvider, useEditView } from "@features/image/edit-view-context";
import { PreviewDialog } from "@features/image/preview-dialog";
import { useFileStore } from "@stores/file-store";
import { TEST_FILE_RECORD } from "@test-utils/test-fixtures.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <>{children}</> : null),
  DialogPortal: ({ children }: any) => <>{children}</>,
  DialogOverlay: ({ className }: any) => <div data-testid="dialog-overlay" className={className} />,
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: () => TEST_FILE_RECORD,
}));

function SetInspectUrl({ url }: { url: string | null }) {
  const { setInspectUrl } = useEditView();
  useEffect(() => {
    setInspectUrl(url);
  }, [url, setInspectUrl]);
  return null;
}

afterEach(cleanup);

function renderDialog(inspectUrl: string | null = null) {
  useFileStore.setState({ files: [TEST_FILE_RECORD] });

  return render(
    <EditViewProvider>
      {inspectUrl && <SetInspectUrl url={inspectUrl} />}
      <PreviewDialog />
    </EditViewProvider>,
  );
}

describe("PreviewDialog", () => {
  it("renders nothing when inspectUrl is null", () => {
    renderDialog(null);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders image with correct src when inspectUrl is set", () => {
    renderDialog("blob:inspect-url");
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:inspect-url");
  });

  it("renders image alt from file name", () => {
    renderDialog("blob:inspect-url");
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toBe(TEST_FILE_RECORD.fileName);
  });

  it("close button calls setInspectUrl(null)", () => {
    renderDialog("blob:inspect-url");
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
  });
});
