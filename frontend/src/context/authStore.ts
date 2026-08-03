import { create } from 'zustand';
import type { User } from '../types';
import axios from 'axios';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
      // Notify backend to clear cookies
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Failed to logout on server:', err);
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Attempt to refresh token first to see if a valid refresh cookie exists
      const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      const newAccessToken = refreshResponse.data.data.accessToken;
      
      // 2. Fetch authenticated user details with the refreshed access token
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      
      const user = meResponse.data.data;
      set({ user, accessToken: newAccessToken, isLoading: false });
    } catch (error) {
      // No active session or refresh token expired
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
