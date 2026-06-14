import { describe, expect, it } from "vite-plus/test";

import { FILMS, getFilmById } from "./films";

describe("getFilmById", () => {
  it('returns Natural with identity tint for "none"', () => {
    const film = getFilmById("none");
    expect(film.name).toBe("Natural");
    expect(film.tint).toEqual([1, 1, 1, 0, 0, 0]);
  });

  it('returns Golden Hour with warm-shifted tint for "gold"', () => {
    const film = getFilmById("gold");
    expect(film.name).toBe("Golden Hour");
    expect(film.tint).toEqual([1.05, 0.98, 0.95, 2, 0, 0]);
  });

  it('returns Seabreeze with cool-shifted tint for "cool"', () => {
    const film = getFilmById("cool");
    expect(film.name).toBe("Seabreeze");
    expect(film.tint).toEqual([0.95, 0.98, 1.05, 0, 0, 2]);
  });

  it('returns Faded for "vintage"', () => {
    const film = getFilmById("vintage");
    expect(film.name).toBe("Faded");
    expect(film.tint).toEqual([0.98, 0.97, 0.95, 2, 0, 0]);
  });

  it('returns Whisper for "muted"', () => {
    const film = getFilmById("muted");
    expect(film.name).toBe("Whisper");
    expect(film.tint).toEqual([0.95, 0.95, 0.97, 2, 2, 2]);
  });
});

describe("FILMS", () => {
  it("contains exactly 5 presets", () => {
    expect(FILMS).toHaveLength(5);
  });

  it("every preset has a valid 6-element tint tuple", () => {
    for (const film of FILMS) {
      expect(film.tint).toHaveLength(6);
      for (const value of film.tint) {
        expect(typeof value).toBe("number");
      }
    }
  });

  it("every preset has a valid hex swatch string", () => {
    for (const film of FILMS) {
      expect(film.swatch).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
