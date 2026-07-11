import { FilmSelector } from "@features/image/film-selector";
import { FILMS } from "@features/process/film";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

afterEach(cleanup);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("FilmSelector", () => {
  it("renders and supports film selection", () => {
    const onValueChange = vi.fn();
    render(<FilmSelector value="none" onValueChange={onValueChange} />);

    expect(screen.getByText("Film")).toBeDefined();

    fireEvent.click(screen.getByRole("combobox"));

    const items = screen.getAllByRole("option");
    const optionTexts = items.map((item) => item.textContent);
    for (const film of FILMS) {
      expect(optionTexts).toContainEqual(expect.stringContaining(film.name));
    }

    for (const item of items) {
      const swatch = item.querySelector(".rounded-full");
      expect(swatch).toBeDefined();
    }

    const goldOption = items.find((el) => el.textContent?.includes("Golden Hour"));
    fireEvent.click(goldOption!);
    expect(onValueChange).toHaveBeenCalledWith("gold");
  });
});
