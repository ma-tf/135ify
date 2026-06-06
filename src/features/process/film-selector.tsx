import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { FILMS, type FilmId } from "@features/process/films";
import { useParameterStore } from "@stores/parameter-store";

interface FilmSelectorProps {
  onValueChange?: () => void;
}

export function FilmSelector({ onValueChange }: FilmSelectorProps) {
  const selectedFilmId = useParameterStore((s) => s.selectedFilmId);
  const setSelectedFilmId = useParameterStore((s) => s.setSelectedFilmId);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-foreground">Film</label>
      <Select
        value={selectedFilmId}
        onValueChange={(v: FilmId) => {
          setSelectedFilmId(v);
          onValueChange?.();
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
