'use client';
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    set({ user: null, token: null, isLoading: false });
  },

  initAuth: () => {
    const token = localStorage.getItem('lms_token');
    const userStr = localStorage.getItem('lms_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
