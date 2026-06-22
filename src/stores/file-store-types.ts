export type FilmId = "none" | "gold" | "cool" | "vintage" | "muted";

export interface ProcessParams {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
  selectedFilmId: FilmId;
  halationIntensity: number;
  halationSpread: number;
  halationThreshold: number;
}
export const DEFAULT_PARAMS: ProcessParams = {
  selectedFilmId: "none",
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
};

export type FileWithState = {
  file: File;
  id: string;
  preview: string;
  params: ProcessParams;
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
};
