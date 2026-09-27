import { create } from 'zustand';
import api from '../api/client';
import { User, ClientProfile, ClientPreferences } from '../types';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: ClientProfile | null;
  toast: ToastState | null;

  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadProfile: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,
  profile: null,
  toast: null,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch (e) {
        // ignore logout error
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, profile: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, isLoading: false });
      if (data.role === 'client') {
        get().loadProfile();
      }
    } catch (err) {
      localStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadProfile: async () => {
    try {
      const { data } = await api.get('/clients/profile');
      set({ profile: data });
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  },

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },

  clearToast: () => set({ toast: null }),
}));
