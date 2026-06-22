import { EditViewProvider, useEditView } from "@features/image/edit-view-context";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

let revokeSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  revokeSpy = vi.fn();
  vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderEditView(defaultImageSrc = "") {
  return renderHook(() => useEditView(), {
    wrapper: ({ children }) => (
      <EditViewProvider defaultImageSrc={defaultImageSrc}>{children}</EditViewProvider>
    ),
  });
}

describe("EditViewProvider", () => {
  it("has correct initial state", () => {
    const { result } = renderEditView();
    expect(result.current.imageSrc).toBe("");
    expect(result.current.showOriginal).toBe(false);
    expect(result.current.inspectUrl).toBeNull();
  });

  it("uses defaultImageSrc when provided", () => {
    const { result } = renderEditView("blob:default");
    expect(result.current.imageSrc).toBe("blob:default");
  });

  it("setImageSrc updates imageSrc", () => {
    const { result } = renderEditView();
    act(() => result.current.setImageSrc("blob:new"));
    expect(result.current.imageSrc).toBe("blob:new");
  });

  it("setShowOriginal updates showOriginal", () => {
    const { result } = renderEditView();
    act(() => result.current.setShowOriginal(true));
    expect(result.current.showOriginal).toBe(true);
  });

  it("setInspectUrl sets inspectUrl", () => {
    const { result } = renderEditView();
    act(() => result.current.setInspectUrl("blob:inspect"));
    expect(result.current.inspectUrl).toBe("blob:inspect");
  });

  it("setInspectUrl revokes previous URL", () => {
    const { result } = renderEditView();
    act(() => result.current.setInspectUrl("blob:old"));
    act(() => result.current.setInspectUrl("blob:new"));
    expect(revokeSpy).toHaveBeenCalledWith("blob:old");
    expect(result.current.inspectUrl).toBe("blob:new");
  });

  it("setInspectUrl(null) revokes previous URL and clears", () => {
    const { result } = renderEditView();
    act(() => result.current.setInspectUrl("blob:url"));
    act(() => result.current.setInspectUrl(null));
    expect(revokeSpy).toHaveBeenCalledWith("blob:url");
    expect(result.current.inspectUrl).toBeNull();
  });

  it("setInspectUrl from null does not revoke", () => {
    const { result } = renderEditView();
    act(() => result.current.setInspectUrl("blob:first"));
    expect(revokeSpy).not.toHaveBeenCalled();
    expect(result.current.inspectUrl).toBe("blob:first");
  });
});

describe("useEditView", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useEditView())).toThrow(
      "useEditView must be used within EditViewProvider",
    );
  });
});
