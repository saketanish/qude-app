import { create } from 'zustand';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = await storage.get('auth_token');
    if (token) {
      try {
        const user = await authService.getMe();
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        await storage.delete('auth_token');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (token, user) => {
    await storage.set('auth_token', token);
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user) => set({ user }),

  logout: async () => {
    await storage.delete('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
