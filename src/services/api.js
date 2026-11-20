import axios from 'axios';
import { API_BASE_URL } from '@env';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = API_BASE_URL || 'https://ezehub-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── REQUEST LOGGING ───────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = config.method?.toUpperCase();
  const url = `${config.baseURL}${config.url}`;
  console.log(`\n┌─── API REQUEST ───────────────────────────────`);
  console.log(`│ ${method} ${url}`);
  if (config.params && Object.keys(config.params).length > 0) {
    console.log(`│ Params:`, JSON.stringify(config.params));
  }
  if (config.data) {
    console.log(`│ Body:`, JSON.stringify(config.data, null, 2));
  }
  console.log(`└────────────────────────────────────────────────\n`);
  return config;
});

// ─── RESPONSE LOGGING ──────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const url = `${response.config.baseURL}${response.config.url}`;
    console.log(`\n┌─── API RESPONSE ✓ ────────────────────────────`);
    console.log(`│ ${method} ${url}`);
    console.log(`│ Status: ${response.status}`);
    console.log(`│ Data:`, JSON.stringify(response.data, null, 2));
    console.log(`└────────────────────────────────────────────────\n`);
    return response;
  },
  async (error) => {
    const original = error.config;
    const method = original?.method?.toUpperCase();
    const url = original ? `${original.baseURL}${original.url}` : 'unknown';

    console.log(`\n┌─── API RESPONSE ✗ ────────────────────────────`);
    console.log(`│ ${method} ${url}`);
    console.log(`│ Status: ${error.response?.status || 'NETWORK ERROR'}`);
    console.log(`│ Error:`, JSON.stringify(error.response?.data || error.message, null, 2));
    console.log(`└────────────────────────────────────────────────\n`);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          console.log(`│ 🔄 Attempting token refresh...`);
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          console.log(`│ ✓ Token refreshed successfully`);
          return api(original);
        } catch (refreshError) {
          console.log(`│ ✗ Token refresh failed, logging out`);
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
