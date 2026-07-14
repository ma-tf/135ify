import { EditViewCloseProvider, useEditViewClose } from "@features/image/edit-view-close-context";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

describe("useEditViewClose", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("returns onClose when used within provider", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useEditViewClose(), {
      wrapper: ({ children }) => (
        <EditViewCloseProvider onClose={onClose}>{children}</EditViewCloseProvider>
      ),
    });

    expect(result.current).toBe(onClose);
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useEditViewClose())).toThrow(
      "useEditViewClose must be used within EditViewCloseProvider",
    );
  });
});
