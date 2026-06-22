import { create } from "zustand";

interface RenderStateStore {
  states: Record<
    string,
    { renderUrl: string | null; isProcessing: boolean; renderError: string | null }
  >;
  get: (id: string) => {
    renderUrl: string | null;
    isProcessing: boolean;
    renderError: string | null;
  };
  set: (
    id: string,
    partial: Partial<{
      renderUrl: string | null;
      isProcessing: boolean;
      renderError: string | null;
    }>,
  ) => void;
  remove: (id: string) => void;
}

const DEFAULT_RENDER_STATE = { renderUrl: null, isProcessing: false, renderError: null } as const;

export const useRenderStateStore = create<RenderStateStore>((set, get) => ({
  states: {},

  get: (id) => get().states[id] ?? DEFAULT_RENDER_STATE,

  set: (id, partial) =>
    set((state) => {
      const existing = state.states[id] ?? DEFAULT_RENDER_STATE;
      if (partial.renderUrl !== undefined && existing.renderUrl) {
        URL.revokeObjectURL(existing.renderUrl);
      }
      return { states: { ...state.states, [id]: { ...existing, ...partial } } };
    }),

  remove: (id) =>
    set((state) => {
      const existing = state.states[id];
      if (existing?.renderUrl) URL.revokeObjectURL(existing.renderUrl);
      const { [id]: _, ...rest } = state.states;
      return { states: rest };
    }),
}));
