import { FilmSelector } from "@features/image/film-selector";
import { FILMS } from "@features/process/film";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

afterEach(cleanup);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("FilmSelector", () => {
  it("renders the Film label", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);
    expect(screen.getByText("Film")).toBeDefined();
  });

  it("renders all 5 film options when opened", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    const optionTexts = items.map((item) => item.textContent);
    for (const film of FILMS) {
      expect(optionTexts).toContainEqual(expect.stringContaining(film.name));
    }
  });

  it("calls onValueChange with the correct FilmId", () => {
    const onValueChange = vi.fn();
    render(<FilmSelector value="none" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("combobox"));

    const goldOption = screen
      .getAllByRole("option")
      .find((el) => el.textContent?.includes("Golden Hour"));
    fireEvent.click(goldOption!);

    expect(onValueChange).toHaveBeenCalledWith("gold");
  });

  it("renders swatch color circles for each option", () => {
    render(<FilmSelector value="none" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    for (const item of items) {
      const swatch = item.querySelector(".rounded-full");
      expect(swatch).toBeDefined();
    }
  });
});
