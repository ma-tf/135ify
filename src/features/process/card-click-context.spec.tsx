import { useCardClick } from "@features/process/card-click-context";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vite-plus/test";

function UseCardClick({ onValue }: { onValue: (v: ReturnType<typeof useCardClick>) => void }) {
  const value = useCardClick();
  useEffect(() => {
    onValue(value);
  });
  return null;
}

describe("useCardClick", () => {
  it("throws when used outside CardClickProvider", () => {
    expect(() => {
      render(<UseCardClick onValue={() => {}} />);
    }).toThrow("useCardClick must be used within CardClickProvider");
  });
});
