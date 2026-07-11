import { FilmSelector } from "@features/image/film-selector";
import { FILMS } from "@features/process/film";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

const { mockSelectOnValueChange } = vi.hoisted(() => ({
  mockSelectOnValueChange: { current: null as ((v: string) => void) | null },
}));

vi.mock("@components/ui/select", () => ({
  Select: ({ children, onValueChange }: any) => {
    mockSelectOnValueChange.current = onValueChange;
    return <>{children}</>;
  },
  SelectTrigger: ({ children, id, className, ...props }: any) => (
    <button
      data-testid="select-trigger"
      id={id}
      className={className}
      role="combobox"
      aria-controls="mock-listbox"
      aria-expanded={false}
      {...props}
    >
      {children}
    </button>
  ),
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children, ...props }: any) => (
    <div
      data-testid="select-item"
      data-value={value}
      role="option"
      aria-selected={false}
      onClick={() => mockSelectOnValueChange.current?.(value)}
      {...props}
    >
      {children}
    </div>
  ),
  SelectScrollUpButton: () => null,
  SelectScrollDownButton: () => null,
  SelectGroup: ({ children }: any) => <>{children}</>,
}));

afterEach(cleanup);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("FilmSelector", () => {
  it("renders label and trigger", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);
    expect(screen.getByText("Film")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders all film options when opened", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");

    for (const film of FILMS) {
      expect(options.some((o) => o.textContent?.includes(film.name))).toBe(true);
    }
  });

  it("renders swatch for each option", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");

    for (const item of options) {
      expect(item.querySelector(".rounded-full")).toBeDefined();
    }
  });

  it("calls onValueChange with correct film id on selection", () => {
    const onValueChange = vi.fn();
    render(<FilmSelector value="none" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    const goldOption = options.find((el) => el.textContent?.includes("Golden Hour"));
    fireEvent.click(goldOption!);
    expect(onValueChange).toHaveBeenCalledWith("gold");
  });
});
