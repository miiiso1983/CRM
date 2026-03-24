import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ROLE_KEY_BY_LEVEL = {
  1: 'sales',
  2: 'manager',
  3: 'admin',
};

const ROLE_KEY_BY_ARABIC_NAME = {
  'مندوب مبيعات': 'sales',
  'مدير مباشر': 'manager',
  'مدير عام': 'admin',
};

const ROLE_LEVEL_BY_KEY = {
  sales: 1,
  manager: 2,
  admin: 3,
};

export const getRoleKey = (userOrRole) => {
  const role = userOrRole?.role || userOrRole;
  const roleName = String(role?.name || '').trim().toLowerCase();

  if (ROLE_LEVEL_BY_KEY[roleName]) {
    return roleName;
  }

  const roleNameAr = String(role?.name_ar || '').trim();
  if (ROLE_KEY_BY_ARABIC_NAME[roleNameAr]) {
    return ROLE_KEY_BY_ARABIC_NAME[roleNameAr];
  }

  const level = Number(role?.level || 0);
  return ROLE_KEY_BY_LEVEL[level] || 'sales';
};

const normalizeUser = (user) => {
  if (!user?.role) return user;

  const roleKey = getRoleKey(user);

  return {
    ...user,
    role: {
      ...user.role,
      name: roleKey,
      level: Number(user.role.level || ROLE_LEVEL_BY_KEY[roleKey] || 1),
    },
  };
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user: normalizeUser(user), token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: normalizeUser({
            ...state.user,
            ...userData,
            role: {
              ...state.user?.role,
              ...userData?.role,
            },
          }),
        }));
      },

      // Check role helpers
      isAdmin: () => getRoleKey(get().user) === 'admin',
      isManager: () => getRoleKey(get().user) === 'manager',
      isSales: () => getRoleKey(get().user) === 'sales',
      getLevel: () => Number(get().user?.role?.level || ROLE_LEVEL_BY_KEY[getRoleKey(get().user)] || 1),
      getRoleKey: () => getRoleKey(get().user),
      getRoleName: () => get().user?.role?.name_ar || '',
    }),
    {
      name: 'alteam-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState || {}),
        };

        return {
          ...mergedState,
          user: normalizeUser(mergedState.user),
        };
      },
    }
  )
);

export default useAuthStore;

