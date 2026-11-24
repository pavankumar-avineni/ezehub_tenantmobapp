import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, AUTH_REFRESH_ENDPOINT } from '@env';
import { useAuthStore } from '../stores/authStore';
import { logAction, logError } from '../utils/logger';

if (!API_BASE_URL || !API_TIMEOUT_MS || !AUTH_REFRESH_ENDPOINT) {
  throw new Error('Missing required API environment variables in .env');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: Number(API_TIMEOUT_MS),
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = config.method?.toUpperCase();
  const url = `${config.baseURL}${config.url}`;
  logAction('API_REQUEST', `${method} ${url}`, {
    params: config.params || null,
    body: config.data || null,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const url = `${response.config.baseURL}${response.config.url}`;
    logAction('API_RESPONSE_SUCCESS', `${method} ${url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const original = error.config;
    const method = original?.method?.toUpperCase();
    const url = original ? `${original.baseURL}${original.url}` : 'UNKNOWN_URL';

    logError('API_RESPONSE_ERROR', `${method} ${url} (Status: ${error.response?.status || 'NETWORK_ERROR'})`, error.response?.data || error.message);

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          logAction('AUTH', 'Attempting token refresh via AUTH_REFRESH_ENDPOINT');
          const { data } = await axios.post(`${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`, { refreshToken });
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          logAction('AUTH', 'Token refresh succeeded');
          return api(original);
        } catch (refreshError) {
          logError('AUTH', 'Token refresh failed; forcing logout', refreshError);
          useAuthStore.getState().logout();
        }
      } else {
        logAction('AUTH', 'No refreshToken available; forcing logout');
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
