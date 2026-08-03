import { create } from 'zustand';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  loginUser: (user: User, accessToken: string) => void;
  logoutUser: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),

  loginUser: (user, accessToken) => {
    set({ user, accessToken, isLoading: false });
  },

  logoutUser: async () => {
    // Clear local state first
    set({ user: null, accessToken: null, isLoading: false });
    try {
      // Notify backend to clear cookies using shared api client
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to logout on server:', err);
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // By requesting '/auth/me' through the shared api client, any missing/expired token
      // will be automatically refreshed using cookies by the Axios response interceptor.
      const meResponse = await api.get('/auth/me');
      const user = meResponse.data.data;
      const token = useAuthStore.getState().accessToken;
      set({ user, accessToken: token, isLoading: false });
    } catch (error) {
      // No active session or refresh token expired
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
