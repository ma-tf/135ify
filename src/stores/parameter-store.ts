import type { FilmId } from "@features/process/films";

import { DEFAULT_FILM_ID } from "@features/process/films";
import { create } from "zustand";

export interface ParameterState {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
  selectedFilmId: FilmId;
  halationIntensity: number;
  halationSpread: number;
  halationThreshold: number;
}

interface ParameterActions {
  setVignetteIntensity: (value: number) => void;
  setVignetteFeather: (value: number) => void;
  setGrainIntensity: (value: number) => void;
  setSelectedFilmId: (value: FilmId) => void;
  setHalationIntensity: (value: number) => void;
  setHalationSpread: (value: number) => void;
  setHalationThreshold: (value: number) => void;
  reset: () => void;
}

type ParameterStore = ParameterState & ParameterActions;

export const DEFAULTS: ParameterState = {
  vignetteIntensity: 30,
  vignetteFeather: 50,
  grainIntensity: 25,
  selectedFilmId: DEFAULT_FILM_ID,
  halationIntensity: 25,
  halationSpread: 20,
  halationThreshold: 85,
};

export const useParameterStore = create<ParameterStore>((set) => ({
  ...DEFAULTS,
  setVignetteIntensity: (vignetteIntensity) => set({ vignetteIntensity }),
  setVignetteFeather: (vignetteFeather) => set({ vignetteFeather }),
  setGrainIntensity: (grainIntensity) => set({ grainIntensity }),
  setSelectedFilmId: (selectedFilmId) => set({ selectedFilmId }),
  setHalationIntensity: (halationIntensity) => set({ halationIntensity }),
  setHalationSpread: (halationSpread) => set({ halationSpread }),
  setHalationThreshold: (halationThreshold) => set({ halationThreshold }),
  reset: () => set(DEFAULTS),
}));
