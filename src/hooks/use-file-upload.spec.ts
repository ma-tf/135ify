import { describe, expect, it } from "vite-plus/test";

import { formatBytes } from "./use-file-upload";

describe("formatBytes", () => {
  it("returns '0 Bytes' for zero", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1GB");
  });

  it("respects custom decimal precision", () => {
    expect(formatBytes(1536, 1)).toBe("1.5KB");
    expect(formatBytes(1536, 0)).toBe("2KB");
  });
});
