import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },

      // Check role helpers
      isAdmin: () => get().user?.role?.name === 'admin',
      isManager: () => get().user?.role?.name === 'manager',
      isSales: () => get().user?.role?.name === 'sales',
      getLevel: () => get().user?.role?.level || 1,
      getRoleName: () => get().user?.role?.name_ar || '',
    }),
    {
      name: 'alteam-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

