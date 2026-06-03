import { useMemo, useState } from "react";

export interface ParametersState {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
}

export interface ParametersActions {
  setVignetteIntensity: (value: number) => void;
  setVignetteFeather: (value: number) => void;
  setGrainIntensity: (value: number) => void;
  reset: () => void;
}

const DEFAULTS: ParametersState = {
  vignetteIntensity: 30,
  vignetteFeather: 50,
  grainIntensity: 25,
};

export const useParameters = (): [ParametersState, ParametersActions] => {
  const [state, setState] = useState<ParametersState>(DEFAULTS);

  const actions = useMemo(
    () => ({
      setVignetteIntensity: (vignetteIntensity: number) =>
        setState((prev) => ({ ...prev, vignetteIntensity })),
      setVignetteFeather: (vignetteFeather: number) =>
        setState((prev) => ({ ...prev, vignetteFeather })),
      setGrainIntensity: (grainIntensity: number) =>
        setState((prev) => ({ ...prev, grainIntensity })),
      reset: () => setState(DEFAULTS),
    }),
    [],
  );

  return [state, actions];
};
