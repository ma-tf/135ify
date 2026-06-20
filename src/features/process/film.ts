import type { FilmId } from "@stores/file-store";

interface FilmPreset {
  id: FilmId;
  name: string;
  tint: [number, number, number, number, number, number];
  swatch: string;
}

export const FILMS: FilmPreset[] = [
  {
    id: "none",
    name: "Natural",
    tint: [1, 1, 1, 0, 0, 0],
    swatch: "#888888",
  },
  {
    id: "gold",
    name: "Golden Hour",
    tint: [1.05, 0.98, 0.95, 2, 0, 0],
    swatch: "#d4a54a",
  },
  {
    id: "cool",
    name: "Seabreeze",
    tint: [0.95, 0.98, 1.05, 0, 0, 2],
    swatch: "#6b8fa3",
  },
  {
    id: "vintage",
    name: "Faded",
    tint: [0.98, 0.97, 0.95, 2, 0, 0],
    swatch: "#a8885a",
  },
  {
    id: "muted",
    name: "Whisper",
    tint: [0.95, 0.95, 0.97, 2, 2, 2],
    swatch: "#8a8a94",
  },
];

export const DEFAULT_FILM_ID: FilmId = "none";

export function getFilmById(id: FilmId): FilmPreset {
  return FILMS.find((f) => f.id === id)!;
}
