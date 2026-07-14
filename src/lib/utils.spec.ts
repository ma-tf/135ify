import { getInitials } from "@lib/utils";
import { describe, expect, it } from "vite-plus/test";

describe("getInitials", () => {
  it("returns initials from a single name", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("returns initials from a two-part name", () => {
    expect(getInitials("Alice Bob")).toBe("AB");
  });

  it("returns only first two initials from a three-part name", () => {
    expect(getInitials("Alice Bob Carol")).toBe("AB");
  });

  it("uppercases lowercase names", () => {
    expect(getInitials("alice bob")).toBe("AB");
  });

  it("returns first letter of email when name is null", () => {
    expect(getInitials(null, "alice@example.com")).toBe("A");
  });

  it("returns first letter of email when name is undefined", () => {
    expect(getInitials(undefined, "bob@example.com")).toBe("B");
  });

  it('returns "?" when name and email are null', () => {
    expect(getInitials(null, null)).toBe("?");
  });

  it('returns "?" when name and email are undefined', () => {
    expect(getInitials(undefined, undefined)).toBe("?");
  });

  it('returns "?" when no arguments are passed', () => {
    expect(getInitials()).toBe("?");
  });

  it("falls back to email when name is an empty string", () => {
    expect(getInitials("", "emily@example.com")).toBe("E");
  });
});
