import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const mockAiProviderState = vi.hoisted(() => ({ apiKey: "sk-test", preferPlatformKey: true }));
const { mockUseMutation, mockUseAction, mockUseAiProviderStore, mockUseQuery } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
  mockUseAction: vi.fn(),
  mockUseAiProviderStore: vi.fn((selector?: (state: typeof mockAiProviderState) => unknown) =>
    selector ? selector(mockAiProviderState) : mockAiProviderState,
  ),
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: mockUseMutation,
  useAction: mockUseAction,
  useQuery_experimental: (args: any) => {
    if (args.query === "subscriptions.byUser") {
      return mockUseQuery();
    }
    return { status: "pending" };
  },
}));

vi.mock("@stores/ai-provider-store", () => ({
  useAiProviderStore: mockUseAiProviderStore,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    subscriptions: { byUser: "subscriptions.byUser" },
    aiGenerationJobs: { retryJob: "retryJob" },
    aiGenerationJobsActions: { processJob: "processJob" },
  },
}));

describe("useRetryTake", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockAiProviderState.apiKey = "sk-test";
    mockAiProviderState.preferPlatformKey = true;
  });

  it("canRetry is true when subscribed even without apiKey", async () => {
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKeys: ["ai_generation_platform"] }],
    });
    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());
    expect(result.current.canRetry).toBe(true);
  });

  it("canRetry is false when no apiKey and no subscription", async () => {
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });
    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());
    expect(result.current.canRetry).toBe(false);
  });

  it("retry with apiKey calls retryJob then processJob", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn();
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "sk-123";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    await act(async () => {
      await result.current.retry("job-1");
    });

    expect(mockRetryJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-123" });
    expect(mockProcessJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-123" });
  });

  it("retry without apiKey uses platform key when subscribed", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn();
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKeys: ["ai_generation_platform"] }],
    });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    await act(async () => {
      await result.current.retry("job-1");
    });

    expect(mockRetryJob).toHaveBeenCalledWith({ jobId: "job-1" });
    expect(mockProcessJob).toHaveBeenCalledWith({ jobId: "job-1" });
  });

  it("canRetry is false when subscribed but platform key disabled and no apiKey", async () => {
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = false;
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKeys: ["ai_generation_platform"] }],
    });
    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());
    expect(result.current.canRetry).toBe(false);
  });

  it("retry uses BYO key when subscribed but platform key disabled", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn();
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "sk-byo";
    mockAiProviderState.preferPlatformKey = false;
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKeys: ["ai_generation_platform"] }],
    });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    await act(async () => {
      await result.current.retry("job-1");
    });

    expect(mockRetryJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-byo" });
    expect(mockProcessJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-byo" });
  });

  it("retry without apiKey returns false and does not call convex hooks when not subscribed", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn();
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.retry("job-1");
    });

    expect(returned).toBe(false);
    expect(mockRetryJob).not.toHaveBeenCalled();
    expect(mockProcessJob).not.toHaveBeenCalled();
  });

  it("uses explicit key when passed as second argument", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn();
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    await act(async () => {
      await result.current.retry("job-1", "sk-explicit");
    });

    expect(mockRetryJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-explicit" });
    expect(mockProcessJob).toHaveBeenCalledWith({ jobId: "job-1", apiKey: "sk-explicit" });
  });

  it("isRetrying is true during retry and false after", async () => {
    let resolveProcess!: (v: unknown) => void;
    const processPromise = new Promise((r) => {
      resolveProcess = r;
    });
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn().mockReturnValue(processPromise);
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "sk-123";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    let retryPromise: Promise<unknown>;
    act(() => {
      retryPromise = result.current.retry("job-1");
    });

    expect(result.current.status).toBe("retrying");

    await act(async () => {
      resolveProcess(undefined);
      await retryPromise!;
    });

    expect(result.current.status).toBe("idle");
  });

  it("handles processJob rejection gracefully", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn().mockRejectedValue(new Error("fail"));
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "sk-123";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.retry("job-1");
    });

    expect(returned).toBeUndefined();
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("fail");
  });

  it("sets generic error message on non-Error rejection", async () => {
    const mockRetryJob = vi.fn();
    const mockProcessJob = vi.fn().mockRejectedValue("network error");
    mockUseMutation.mockReturnValue(mockRetryJob);
    mockUseAction.mockReturnValue(mockProcessJob);
    mockAiProviderState.apiKey = "sk-123";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "success", data: [] });

    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());

    await act(async () => {
      await result.current.retry("job-1");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Retry failed");
  });

  it("canRetry is false when subscriptions are still loading", async () => {
    mockAiProviderState.apiKey = "";
    mockAiProviderState.preferPlatformKey = true;
    mockUseQuery.mockReturnValue({ status: "pending" });
    const { useRetryTake } = await import("./use-retry-take");
    const { result } = renderHook(() => useRetryTake());
    expect(result.current.canRetry).toBe(false);
  });
});
