import { create } from "zustand";

export interface ParameterState {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
}

interface ParameterActions {
  setVignetteIntensity: (value: number) => void;
  setVignetteFeather: (value: number) => void;
  setGrainIntensity: (value: number) => void;
  reset: () => void;
}

type ParameterStore = ParameterState & ParameterActions;

export const DEFAULTS: ParameterState = {
  vignetteIntensity: 30,
  vignetteFeather: 50,
  grainIntensity: 25,
};

export const useParameterStore = create<ParameterStore>((set) => ({
  ...DEFAULTS,
  setVignetteIntensity: (vignetteIntensity) => set({ vignetteIntensity }),
  setVignetteFeather: (vignetteFeather) => set({ vignetteFeather }),
  setGrainIntensity: (grainIntensity) => set({ grainIntensity }),
  reset: () => set(DEFAULTS),
}));
