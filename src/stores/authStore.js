import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setAuth: ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken, isLoading: false });
    SecureStore.setItemAsync('auth', JSON.stringify({ user, accessToken, refreshToken }));
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    const { user } = get();
    SecureStore.setItemAsync('auth', JSON.stringify({ user, accessToken, refreshToken }));
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    SecureStore.deleteItemAsync('auth');
  },

  loadAuth: async () => {
    try {
      const stored = await SecureStore.getItemAsync('auth');
      if (stored) {
        const { user, accessToken, refreshToken } = JSON.parse(stored);
        set({ user, accessToken, refreshToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
