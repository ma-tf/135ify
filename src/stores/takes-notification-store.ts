import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TakesNotificationState {
  lastSeenAt: number | null;
  markSeen: () => void;
}

export const useTakesNotificationStore = create<TakesNotificationState>()(
  persist(
    (set) => ({
      lastSeenAt: null,
      markSeen: () => set({ lastSeenAt: Date.now() }),
    }),
    { name: "takes-notification" },
  ),
);
