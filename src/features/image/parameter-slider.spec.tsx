import { ParameterSlider } from "@features/image/parameter-slider";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@components/ui/slider", () => ({
  Slider({
    value,
    onValueChange,
    min,
    max,
    step,
  }: {
    value?: number[];
    onValueChange: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
  }) {
    return (
      <input
        type="range"
        aria-valuenow={value?.[0] ?? 0}
        value={value?.[0] ?? 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange([Number(e.target.value)])}
      />
    );
  },
}));

afterEach(cleanup);

describe("ParameterSlider", () => {
  it("renders the label", () => {
    render(<ParameterSlider label="Intensity" value={50} onValueChange={vi.fn()} />);
    expect(screen.getByText("Intensity")).toBeDefined();
  });

  it("displays the current value", () => {
    render(<ParameterSlider label="Spread" value={42} onValueChange={vi.fn()} />);
    expect(screen.getByText("42")).toBeDefined();
  });

  it("calls onValueChange when slider changes", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <ParameterSlider label="Threshold" value={10} onValueChange={onValueChange} />,
    );
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "75" } });
    expect(onValueChange).toHaveBeenCalledWith(75);
  });

  it("forwards min, max, and step to Slider", () => {
    const { container } = render(
      <ParameterSlider
        label="Feather"
        value={5}
        onValueChange={vi.fn()}
        min={1}
        max={200}
        step={5}
      />,
    );
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe("1");
    expect(slider.max).toBe("200");
    expect(slider.step).toBe("5");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ParameterSlider label="X" value={0} onValueChange={vi.fn()} className="my-custom" />,
    );
    expect(container.firstElementChild?.className).toContain("my-custom");
  });

  it("uses default min, max, step when not provided", () => {
    const { container } = render(<ParameterSlider label="Y" value={0} onValueChange={vi.fn()} />);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe("0");
    expect(slider.max).toBe("100");
    expect(slider.step).toBe("1");
  });
});
