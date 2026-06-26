import type { FileRecord } from "@stores/file-store-types";

import { FileProvider, useFile } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { useRenderStateStore } from "@stores/render-state-store";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

afterEach(cleanup);

const TEST_FILE_RECORD: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  createdAt: Date.now(),
};

beforeEach(() => {
  useFileStore.setState({ files: [TEST_FILE_RECORD] });
  useRenderStateStore.setState({ states: {} });
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
        <FileProvider fileId={TEST_FILE_RECORD.id}>
          <UseFile
            onValue={(v) => {
              captured = v;
            }}
          />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.id).toBe(TEST_FILE_RECORD.id);
    expect(captured!.sourceUrl).toBe(TEST_FILE_RECORD.sourceUrl);
  });

  it("throws when used outside provider", () => {
    expect(() => {
      render(<UseFile onValue={() => {}} />);
    }).toThrow("useFile must be used within FileProvider");
  });

  it("reflects render state updates", () => {
    let captured: ReturnType<typeof useFile> | undefined;

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD.id}>
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
      useRenderStateStore.getState().set(TEST_FILE_RECORD.id, { renderUrl: "blob:new" });
    });

    expect(captured!.renderUrl).toBe("blob:new");
  });

  it("throws when file is removed from store", () => {
    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD.id}>
          <UseFile onValue={() => {}} />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(() => {
      act(() => {
        useFileStore.setState({ files: [] });
      });
    }).toThrow();
  });

  it("throws for missing file id", () => {
    expect(() => {
      render(
        <TestStorageProvider>
          <FileProvider fileId="nonexistent">
            <UseFile onValue={() => {}} />
          </FileProvider>
        </TestStorageProvider>,
      );
    }).toThrow('FileProvider: file not found for id "nonexistent"');
  });
});
