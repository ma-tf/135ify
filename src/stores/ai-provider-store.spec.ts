import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { storeMap } = vi.hoisted(() => {
  const storeMap = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => storeMap.get(key) ?? null,
    setItem: (key: string, value: string) => storeMap.set(key, value),
    removeItem: (key: string) => storeMap.delete(key),
    clear: () => storeMap.clear(),
    get length() {
      return storeMap.size;
    },
    key: (index: number) => [...storeMap.keys()][index] ?? null,
  };
  vi.stubGlobal("localStorage", mockStorage);
  return { storeMap };
});

import { useAiProviderStore } from "@stores/ai-provider-store";

beforeEach(() => {
  storeMap.clear();
  useAiProviderStore.setState({ apiKey: "", preferUserKey: false });
});

afterEach(() => {
  storeMap.clear();
});

describe("useAiProviderStore", () => {
  it("starts with an empty apiKey", () => {
    expect(useAiProviderStore.getState().apiKey).toBe("");
  });

  it("setApiKey updates the apiKey", () => {
    useAiProviderStore.getState().setApiKey("sk-test-key");
    expect(useAiProviderStore.getState().apiKey).toBe("sk-test-key");
  });

  it("clearApiKey resets the apiKey to empty", () => {
    useAiProviderStore.getState().setApiKey("sk-test-key");
    useAiProviderStore.getState().clearApiKey();
    expect(useAiProviderStore.getState().apiKey).toBe("");
  });

  it("persists apiKey to localStorage under ai-provider-key", () => {
    useAiProviderStore.getState().setApiKey("sk-persisted");
    const stored = JSON.parse(storeMap.get("ai-provider-key") ?? "{}");
    expect(stored.state.apiKey).toBe("sk-persisted");
  });

  it("starts with preferUserKey as false", () => {
    expect(useAiProviderStore.getState().preferUserKey).toBe(false);
  });

  it("setPreferUserKey updates the preference", () => {
    useAiProviderStore.getState().setPreferUserKey(true);
    expect(useAiProviderStore.getState().preferUserKey).toBe(true);
  });

  it("persists preferUserKey to localStorage", () => {
    useAiProviderStore.getState().setPreferUserKey(true);
    const stored = JSON.parse(storeMap.get("ai-provider-key") ?? "{}");
    expect(stored.state.preferUserKey).toBe(true);
  });
});
