import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vite-plus/test";

export function setupTests() {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
    HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const style = document.createElement("style");
    style.textContent =
      "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }";
    document.head.appendChild(style);
  });
}
