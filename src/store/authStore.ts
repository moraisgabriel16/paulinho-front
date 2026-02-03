import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erro ao fazer login',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, role = 'professor') => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.register(name, email, password, role);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erro ao registrar',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  loadUser: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  },
}));
