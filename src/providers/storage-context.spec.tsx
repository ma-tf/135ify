import { useStorage } from "@providers/storage-context";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vite-plus/test";

function UseStorage({ onValue }: { onValue: (v: ReturnType<typeof useStorage>) => void }) {
  const value = useStorage();
  useEffect(() => {
    onValue(value);
  });
  return null;
}

describe("useStorage", () => {
  it("throws when used outside StorageProvider", () => {
    expect(() => {
      render(<UseStorage onValue={() => {}} />);
    }).toThrow("useStorage must be used within a StorageProvider");
  });
});
