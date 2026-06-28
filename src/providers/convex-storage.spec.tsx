import ConvexStorageProvider from "@providers/convex-storage";
import { useStorage } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

// ---- Mocks ---

const mockUseQuery = vi.hoisted(() => vi.fn().mockReturnValue({ status: "pending" }));
const mockMutation = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("convex/react", () => ({
  useMutation: () => mockMutation,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@hooks/use-convex-upload", () => ({
  useConvexUpload: () => ({ addFiles: vi.fn() }),
}));

vi.mock("@features/image/use-ensure-processed", () => ({
  useEnsureProcessed: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

// ---- Helpers ----

function StorageReader({ onValue }: { onValue: (v: ReturnType<typeof useStorage>) => void }) {
  onValue(useStorage());
  return null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useFileStore.setState({ files: [] });
});

// ---- Tests ----

describe("ConvexStorageProvider", () => {
  it("provides loading=true while query is pending", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.loading).toBe(true);
    expect(captured!.error).toBeNull();
  });

  it("provides loading=false and error when query fails", () => {
    const testError = new Error("Convex query failed");
    mockUseQuery.mockReturnValue({ status: "error", error: testError });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.loading).toBe(false);
    expect(captured!.error).toBe(testError);
  });

  it("provides empty files when query succeeds with no data", async () => {
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    await vi.waitFor(() => {
      expect(captured).toBeDefined();
      expect(captured!.files).toEqual([]);
      expect(captured!.loading).toBe(false);
      expect(captured!.error).toBeNull();
    });
  });

  it("hydrates files from Convex query data", async () => {
    mockMutation.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [
        {
          _id: "img001",
          _creationTime: 1000,
          userId: "user1",
          sourceStorageId: "storage1",
          fileName: "photo.jpg",
          sourceUrl: "https://convex.cloud/photo.jpg",
          params: {
            selectedFilmId: "gold",
            halationIntensity: 0.5,
            halationSpread: 0.3,
            halationThreshold: 0.8,
            vignetteIntensity: 0.2,
            vignetteFeather: 0.5,
            grainIntensity: 0.1,
          },
        },
        {
          _id: "img002",
          _creationTime: 2000,
          userId: "user1",
          sourceStorageId: "storage2",
          fileName: "portrait.jpg",
          sourceUrl: "https://convex.cloud/portrait.jpg",
          params: {
            selectedFilmId: "muted",
            halationIntensity: 0,
            halationSpread: 0,
            halationThreshold: 0,
            vignetteIntensity: 0,
            vignetteFeather: 0,
            grainIntensity: 0,
          },
        },
      ],
    });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    await vi.waitFor(() => {
      expect(captured?.files).toHaveLength(2);
    });

    expect(captured!.files[0].id).toBe("img001");
    expect(captured!.files[0].fileName).toBe("photo.jpg");
    expect(captured!.files[0].params.selectedFilmId).toBe("gold");
    expect(captured!.files[0].renderUrl).toBeNull();
    expect(captured!.files[0].isProcessing).toBe(false);

    expect(captured!.files[1].id).toBe("img002");
    expect(captured!.files[1].fileName).toBe("portrait.jpg");
    expect(captured!.files[1].params.selectedFilmId).toBe("muted");
  });

  it("preserves existing render state when hydrating", async () => {
    useFileStore.setState({
      files: [
        {
          id: "img001",
          fileName: "photo.jpg",
          sourceUrl: "blob:existing",
          params: { ...DEFAULT_PARAMS },
          createdAt: 1000,
          renderUrl: "blob:rendered",
          isProcessing: false,
          renderError: null,
        },
      ],
    });

    mockMutation.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [
        {
          _id: "img001",
          _creationTime: 1000,
          userId: "user1",
          sourceStorageId: "storage1",
          fileName: "photo.jpg",
          sourceUrl: "https://convex.cloud/photo.jpg",
          params: {
            selectedFilmId: "none",
            halationIntensity: 0,
            halationSpread: 0,
            halationThreshold: 0,
            vignetteIntensity: 0,
            vignetteFeather: 0,
            grainIntensity: 0,
          },
        },
      ],
    });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    await vi.waitFor(() => {
      expect(captured?.files).toHaveLength(1);
    });

    expect(captured!.files[0].renderUrl).toBe("blob:rendered");
  });

  it("removeFile calls deleteImage mutation and removes from store", async () => {
    useFileStore.setState({
      files: [
        {
          id: "f1",
          fileName: "test.jpg",
          sourceUrl: "blob:source",
          params: { ...DEFAULT_PARAMS },
          createdAt: 1000,
          renderUrl: "blob:rendered",
          isProcessing: false,
          renderError: null,
        },
      ],
    });

    mockMutation.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ status: "success", data: null });

    let captured: ReturnType<typeof useStorage> | undefined;
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    captured!.removeFile("f1");

    await vi.waitFor(() => {
      expect(useFileStore.getState().files).toHaveLength(0);
    });
    expect(mockMutation).toHaveBeenCalledWith({ imageId: "f1" });

    expect(revokeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:rendered");
  });

  it("removeFile skips revoke when file has no renderUrl", async () => {
    useFileStore.setState({
      files: [
        {
          id: "f1",
          fileName: "test.jpg",
          sourceUrl: "blob:source",
          params: { ...DEFAULT_PARAMS },
          createdAt: 1000,
          renderUrl: null,
          isProcessing: false,
          renderError: null,
        },
      ],
    });

    mockMutation.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ status: "success", data: null });

    let captured: ReturnType<typeof useStorage> | undefined;
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    captured!.removeFile("f1");

    await vi.waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith({ imageId: "f1" });
    });
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it("removeFile shows toast when deleteImage fails", async () => {
    useFileStore.setState({
      files: [
        {
          id: "f1",
          fileName: "test.jpg",
          sourceUrl: "blob:source",
          params: { ...DEFAULT_PARAMS },
          createdAt: 1000,
          renderUrl: null,
          isProcessing: false,
          renderError: null,
        },
      ],
    });

    mockMutation.mockRejectedValue(new Error("Network error"));
    mockUseQuery.mockReturnValue({ status: "success", data: null });

    let captured: ReturnType<typeof useStorage> | undefined;

    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    captured!.removeFile("f1");

    await vi.waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete image");
    });
  });

  it("updateParams calls store and Convex mutation", () => {
    useFileStore.setState({
      files: [
        {
          id: "f1",
          fileName: "test.jpg",
          sourceUrl: "blob:source",
          params: { ...DEFAULT_PARAMS },
          createdAt: 1000,
          renderUrl: null,
          isProcessing: false,
          renderError: null,
        },
      ],
    });

    mockMutation.mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ status: "success", data: null });

    let captured: ReturnType<typeof useStorage> | undefined;
    render(
      <ConvexStorageProvider>
        <StorageReader
          onValue={(v) => {
            captured = v;
          }}
        />
      </ConvexStorageProvider>,
    );

    captured!.updateParams("f1", { vignetteIntensity: 0.8 });

    expect(useFileStore.getState().files[0].params.vignetteIntensity).toBe(0.8);
    expect(mockMutation).toHaveBeenCalledWith({
      imageId: "f1",
      params: { vignetteIntensity: 0.8 },
    });
  });
});
