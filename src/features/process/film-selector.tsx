import type { FilmId } from "@stores/file-store";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { FILMS } from "@features/process/film";

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
