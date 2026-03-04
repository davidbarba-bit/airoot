import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          set({ isLoading: true });
          const { data } = await api.get('/auth/me');
          set({ user: data, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
          localStorage.removeItem('token');
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
        window.location.href = '/login';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN' || user?.role === 'OWNER';
      },

      isOwner: () => {
        const { user } = get();
        return user?.role === 'OWNER';
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
