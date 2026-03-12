import { create } from 'zustand';

export const useQueueStore = create((set, get) => ({
  activeToken: null,
  activeQueue: null,
  position: null,
  waitMinutes: null,
  history: [],

  setActiveToken: (token, queue, position, waitMinutes) =>
    set({ activeToken: token, activeQueue: queue, position, waitMinutes }),

  updatePosition: (currentServing) => {
    const { activeToken } = get();
    if (!activeToken) return;
    const newPosition = Math.max(0, activeToken.token_number - currentServing);
    set({ position: newPosition });
  },

  clearActiveToken: () =>
    set({ activeToken: null, activeQueue: null, position: null, waitMinutes: null }),

  setHistory: (history) => set({ history }),
}));
