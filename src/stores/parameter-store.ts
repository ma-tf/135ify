import type { FilmId } from "@features/process/films";

import { DEFAULT_FILM_ID } from "@features/process/films";
import { create } from "zustand";

export interface ParameterState {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
  selectedFilmId: FilmId;
}

interface ParameterActions {
  setVignetteIntensity: (value: number) => void;
  setVignetteFeather: (value: number) => void;
  setGrainIntensity: (value: number) => void;
  setSelectedFilmId: (value: FilmId) => void;
  reset: () => void;
}

type ParameterStore = ParameterState & ParameterActions;

export const DEFAULTS: ParameterState = {
  vignetteIntensity: 30,
  vignetteFeather: 50,
  grainIntensity: 25,
  selectedFilmId: DEFAULT_FILM_ID,
};

export const useParameterStore = create<ParameterStore>((set) => ({
  ...DEFAULTS,
  setVignetteIntensity: (vignetteIntensity) => set({ vignetteIntensity }),
  setVignetteFeather: (vignetteFeather) => set({ vignetteFeather }),
  setGrainIntensity: (grainIntensity) => set({ grainIntensity }),
  setSelectedFilmId: (selectedFilmId) => set({ selectedFilmId }),
  reset: () => set(DEFAULTS),
}));
