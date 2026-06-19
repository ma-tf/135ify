import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

export type FilmId = "none" | "gold" | "cool" | "vintage" | "muted";

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

interface FilmSelectorProps {
  value: FilmId;
  onValueChange: (value: FilmId) => void;
}

export function FilmSelector({ value, onValueChange }: FilmSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-foreground">Film</label>
      <Select
        value={value}
        onValueChange={(v: FilmId) => {
          onValueChange(v);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILMS.map((film) => (
            <SelectItem key={film.id} value={film.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: film.swatch }}
                />
                {film.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
