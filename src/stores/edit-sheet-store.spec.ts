import { useEditSheetStore } from "@stores/edit-sheet-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

beforeEach(() => {
  useEditSheetStore.setState({
    openSheetId: null,
    imageSrc: "",
    showOriginal: {},
    inspectUrl: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEditSheetStore", () => {
  it("has correct initial state", () => {
    const state = useEditSheetStore.getState();
    expect(state.openSheetId).toBeNull();
    expect(state.imageSrc).toBe("");
    expect(state.showOriginal).toEqual({});
    expect(state.inspectUrl).toBeNull();
  });

  it("setOpenSheetId sets the id", () => {
    useEditSheetStore.getState().setOpenSheetId("file-1");
    expect(useEditSheetStore.getState().openSheetId).toBe("file-1");
  });

  it("setOpenSheetId(null) clears the id", () => {
    useEditSheetStore.getState().setOpenSheetId("file-1");
    useEditSheetStore.getState().setOpenSheetId(null);
    expect(useEditSheetStore.getState().openSheetId).toBeNull();
  });

  it("setImageSrc sets the src", () => {
    useEditSheetStore.getState().setImageSrc("blob:new-url");
    expect(useEditSheetStore.getState().imageSrc).toBe("blob:new-url");
  });

  it("setShowOriginal sets per-file flag", () => {
    useEditSheetStore.getState().setShowOriginal("file-1", true);
    expect(useEditSheetStore.getState().showOriginal).toEqual({ "file-1": true });
  });

  it("setShowOriginal does not overwrite other file flags", () => {
    useEditSheetStore.getState().setShowOriginal("file-1", true);
    useEditSheetStore.getState().setShowOriginal("file-2", true);
    expect(useEditSheetStore.getState().showOriginal).toEqual({
      "file-1": true,
      "file-2": true,
    });
  });

  it("setShowOriginal updates same ID", () => {
    useEditSheetStore.getState().setShowOriginal("file-1", true);
    useEditSheetStore.getState().setShowOriginal("file-1", false);
    expect(useEditSheetStore.getState().showOriginal).toEqual({ "file-1": false });
  });

  it("setInspectUrl revokes previous URL before setting", () => {
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });

    useEditSheetStore.getState().setInspectUrl("blob:old");
    useEditSheetStore.getState().setInspectUrl("blob:new");

    expect(revokeSpy).toHaveBeenCalledWith("blob:old");
    expect(useEditSheetStore.getState().inspectUrl).toBe("blob:new");

    vi.unstubAllGlobals();
  });

  it("setInspectUrl(null) revokes previous URL and clears", () => {
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });

    useEditSheetStore.getState().setInspectUrl("blob:url");
    useEditSheetStore.getState().setInspectUrl(null);

    expect(revokeSpy).toHaveBeenCalledWith("blob:url");
    expect(useEditSheetStore.getState().inspectUrl).toBeNull();

    vi.unstubAllGlobals();
  });

  it("setInspectUrl from null does not revoke", () => {
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });

    useEditSheetStore.getState().setInspectUrl("blob:first");

    expect(revokeSpy).not.toHaveBeenCalled();
    expect(useEditSheetStore.getState().inspectUrl).toBe("blob:first");

    vi.unstubAllGlobals();
  });
});
