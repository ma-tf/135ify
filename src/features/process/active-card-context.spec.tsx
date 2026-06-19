import { ActiveCardProvider, useActiveCard } from "@features/process/active-card-context";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

afterEach(cleanup);

function UseActiveCard({ onValue }: { onValue: (v: ReturnType<typeof useActiveCard>) => void }) {
  onValue(useActiveCard());
  return null;
}

describe("useActiveCard", () => {
  it("returns context value inside provider", () => {
    let captured: ReturnType<typeof useActiveCard> | undefined;

    render(
      <ActiveCardProvider>
        <UseActiveCard
          onValue={(v) => {
            captured = v;
          }}
        />
      </ActiveCardProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.activeCardId).toBeNull();
    expect(typeof captured!.setActiveCardId).toBe("function");
  });

  it("throws when used outside provider", () => {
    expect(() => {
      render(<UseActiveCard onValue={() => {}} />);
    }).toThrow("useActiveCard must be used within ActiveCardProvider");
  });

  it("setActiveCardId updates activeCardId", () => {
    let captured: ReturnType<typeof useActiveCard> | undefined;

    render(
      <ActiveCardProvider>
        <UseActiveCard
          onValue={(v) => {
            captured = v;
          }}
        />
      </ActiveCardProvider>,
    );

    act(() => {
      captured!.setActiveCardId("card-42");
    });

    expect(captured!.activeCardId).toBe("card-42");

    act(() => {
      captured!.setActiveCardId(null);
    });

    expect(captured!.activeCardId).toBeNull();
  });
});
