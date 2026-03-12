import { create } from 'zustand';
import api, { authService } from '../services/api';

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    const token = localStorage.getItem('gate_token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const r = await api.get('/auth/me');
      if (!['gate_operator', 'admin'].includes(r.data.user?.role)) throw new Error('Not authorized');
      set({ user: r.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('gate_token');
      set({ isLoading: false });
    }
  },

  login: (token, user) => {
    localStorage.setItem('gate_token', token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('gate_token');
    set({ user: null, isAuthenticated: false });
  },

  // Scan state
  scanResult: null,    // { result, allowed, message, token }
  scanCount: 0,
  entryCount: 0,
  rejectCount: 0,
  logs: [],

  setScanResult: (result) => {
    set((s) => ({
      scanResult: result,
      scanCount:  s.scanCount + 1,
      entryCount: result?.allowed ? s.entryCount + 1 : s.entryCount,
      rejectCount: !result?.allowed ? s.rejectCount + 1 : s.rejectCount,
      logs: result ? [{ ...result, time: new Date() }, ...s.logs].slice(0, 50) : s.logs,
    }));
  },

  clearResult: () => set({ scanResult: null }),
}));
