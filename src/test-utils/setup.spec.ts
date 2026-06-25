import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vite-plus/test";

export function setupTests() {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
}
