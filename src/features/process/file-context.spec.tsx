import type { FileWithState } from "@stores/file-store";

import { FileProvider, useFile } from "@features/process/file-context";
import { DEFAULT_PARAMS } from "@features/process/process-image";
import { useFileStore } from "@stores/file-store";
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
      <FileProvider fileId={TEST_FILE.id}>
        <UseFile
          onValue={(v) => {
            captured = v;
          }}
        />
      </FileProvider>,
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
      <FileProvider fileId={TEST_FILE.id}>
        <UseFile
          onValue={(v) => {
            captured = v;
          }}
        />
      </FileProvider>,
    );

    expect(captured!.renderUrl).toBeNull();

    act(() => {
      useFileStore.setState((s) => ({
        files: s.files.map((f) => (f.id === TEST_FILE.id ? { ...f, renderUrl: "blob:new" } : f)),
      }));
    });

    expect(captured!.renderUrl).toBe("blob:new");
  });

  it("throws for missing file id", () => {
    expect(() => {
      render(
        <FileProvider fileId="nonexistent">
          <UseFile onValue={() => {}} />
        </FileProvider>,
      );
    }).toThrow("useFile must be used within FileProvider");
  });
});
