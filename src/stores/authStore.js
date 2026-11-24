import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, AUTH_VERIFY_ENDPOINT } from '@env';
import { logAction, logError } from '../utils/logger';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setAuth: ({ user, accessToken, refreshToken }) => {
    logAction('AUTH', 'User authenticated and session persisted', { email: user?.email });
    set({ user, accessToken, refreshToken, isLoading: false });
    SecureStore.setItemAsync('auth', JSON.stringify({ user, accessToken, refreshToken }));
  },

  setTokens: (accessToken, refreshToken) => {
    logAction('AUTH', 'Access and refresh tokens updated');
    set({ accessToken, refreshToken });
    const { user } = get();
    SecureStore.setItemAsync('auth', JSON.stringify({ user, accessToken, refreshToken }));
  },

  logout: () => {
    logAction('AUTH', 'User logged out and SecureStore session cleared');
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    SecureStore.deleteItemAsync('auth');
  },

  loadAuth: async () => {
    logAction('AUTH', 'Checking persisted session in SecureStore on app startup');
    try {
      const stored = await SecureStore.getItemAsync('auth');
      if (!stored) {
        logAction('AUTH', 'No persisted session found; routing to Login');
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        return;
      }

      const { user, accessToken, refreshToken } = JSON.parse(stored);
      if (!accessToken) {
        logAction('AUTH', 'Stored session missing accessToken; clearing and routing to Login');
        await SecureStore.deleteItemAsync('auth');
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        return;
      }

      logAction('AUTH', 'Validating persisted accessToken against backend before rendering UI');
      await axios.get(`${API_BASE_URL}${AUTH_VERIFY_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: Number(API_TIMEOUT_MS),
      });

      logAction('AUTH', 'Persisted token verified valid; restoring authenticated session', { email: user?.email });
      set({ user, accessToken, refreshToken, isLoading: false });
    } catch (err) {
      logError('AUTH', 'Persisted token invalid or expired on startup; clearing session before UI render', err);
      await SecureStore.deleteItemAsync('auth');
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },
}));
