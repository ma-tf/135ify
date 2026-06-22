import type { FileWithState } from "@stores/file-store-types";

import { FileProvider, useFile } from "@features/process/file-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

afterEach(cleanup);

const TEST_FILE: FileWithState = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

beforeEach(() => {
  useFileStore.setState({ files: [TEST_FILE] });
});

function UseFile({ onValue }: { onValue: (v: ReturnType<typeof useFile>) => void }) {
  onValue(useFile());
  return null;
}

describe("useFile", () => {
  it("returns matching file from store", () => {
    let captured: ReturnType<typeof useFile> | undefined;

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <UseFile
            onValue={(v) => {
              captured = v;
            }}
          />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.id).toBe(TEST_FILE.id);
    expect(captured!.preview).toBe(TEST_FILE.preview);
  });

  it("throws when used outside provider", () => {
    expect(() => {
      render(<UseFile onValue={() => {}} />);
    }).toThrow("useFile must be used within FileProvider");
  });

  it("reflects store updates", () => {
    let captured: ReturnType<typeof useFile> | undefined;

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <UseFile
            onValue={(v) => {
              captured = v;
            }}
          />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(captured!.renderUrl).toBeNull();

    act(() => {
      useFileStore.setState((s) => ({
        files: s.files.map((f) => (f.id === TEST_FILE.id ? { ...f, renderUrl: "blob:new" } : f)),
      }));
    });

    expect(captured!.renderUrl).toBe("blob:new");
  });

  it("renders nothing when file is removed from store", () => {
    const { container } = render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE.id}>
          <div data-testid="child" />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(container.querySelector("[data-testid='child']")).not.toBeNull();

    act(() => {
      useFileStore.setState({ files: [] });
    });

    expect(container.querySelector("[data-testid='child']")).toBeNull();
  });

  it("renders nothing for missing file id", () => {
    const { container } = render(
      <TestStorageProvider>
        <FileProvider fileId="nonexistent">
          <div data-testid="child" />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(container.querySelector("[data-testid='child']")).toBeNull();
  });
});
