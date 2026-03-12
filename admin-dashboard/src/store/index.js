import { create } from 'zustand';
import api from '../services/api';

// ── Auth Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('admin_token');
      set({ isLoading: false });
    }
  },

  login: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ user: null, isAuthenticated: false });
  },
}));

// ── Queue Store ─────────────────────────────────────────────────────────────
export const useQueueStore = create((set, get) => ({
  temples: [],
  selectedTemple: null,
  queues: [],
  analytics: {},

  loadTemples: async () => {
    const res = await api.get('/admin/temples');
    set({ temples: res.data.temples || [] });
  },

  selectTemple: async (temple) => {
    set({ selectedTemple: temple });
    const res = await api.get(`/admin/queues/${temple.id}`);
    set({ queues: res.data.queues || [] });
  },

  loadAnalytics: async (queueId) => {
    const res = await api.get(`/admin/queues/${queueId}/analytics`);
    set((s) => ({ analytics: { ...s.analytics, [queueId]: res.data.analytics } }));
  },

  updateQueueStatus: async (queueId, status) => {
    await api.patch(`/admin/queues/${queueId}/status`, { status });
    set((s) => ({
      queues: s.queues.map((q) => q.id === queueId ? { ...q, status } : q),
    }));
  },

  advanceQueue: async (queueId) => {
    const res = await api.post(`/admin/queues/${queueId}/advance`);
    const { newServing } = res.data;
    set((s) => ({
      queues: s.queues.map((q) =>
        q.id === queueId ? { ...q, current_serving: newServing } : q
      ),
    }));
    return res.data;
  },

  liveUpdate: (queueId, { currentServing, totalIssued }) => {
    set((s) => ({
      queues: s.queues.map((q) =>
        q.id === queueId
          ? { ...q, current_serving: currentServing, total_issued: totalIssued }
          : q
      ),
    }));
  },

  addQueue: (queue) => set((s) => ({ queues: [...s.queues, queue] })),
  addTemple: (temple) => set((s) => ({ temples: [...s.temples, temple] })),
}));
