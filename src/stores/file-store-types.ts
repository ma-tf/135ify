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

export interface FileRecord {
  id: string;
  fileName: string;
  sourceUrl: string;
  params: ProcessParams;
  createdAt: number;
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
}

export type FileWithState = FileRecord;

export interface FileStore {
  files: FileRecord[];
  addFiles: (records: FileRecord[]) => void;
  updateParams: (id: string, params: Partial<ProcessParams>) => void;
  removeFile: (id: string) => void;
  setRenderUrl: (id: string, renderUrl: string | null) => void;
  setProcessing: (id: string, isProcessing: boolean) => void;
  setRenderError: (id: string, renderError: string | null) => void;
  clearFiles: () => void;
}
