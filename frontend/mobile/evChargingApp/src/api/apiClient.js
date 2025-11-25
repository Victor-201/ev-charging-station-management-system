// src/api/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import store from '../store/store';
import { setAccessToken, logoutAsync } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../config/constants';
import { logger } from '../utils/logger';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const stateToken = store.getState().auth?.accessToken;
    if (stateToken) {
      config.headers.Authorization = `Bearer ${stateToken}`;
    } else {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    logger.warn('Failed to attach token to request:', e?.message);
  }
  return config;
});

/**
 * Determine if error is a network error (connectivity issue)
 * Network errors should not trigger logout
 */
const isNetworkError = (error) => {
  return (
    !error.response &&
    error.code !== 'ERR_CANCELED' &&
    error.message !== 'Request timeout'
  );
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Don't retry network errors - user will see the appropriate error message
    if (isNetworkError(error)) {
      logger.error('Network error:', error?.message);
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network error. Please check your connection.',
      });
    }

    // Retry token refresh only for 401 (unauthorized) responses from API
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refreshToken =
          store.getState().auth?.refreshToken ||
          (await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));

        if (!refreshToken) {
          logger.warn('No refresh token available, logging out');
          throw new Error('No refresh token');
        }

        logger.debug('Attempting to refresh access token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        if (data?.accessToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
          if (data.refreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
          }
          store.dispatch(setAccessToken(data.accessToken));
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          logger.debug('Token refreshed successfully');
          return apiClient(original);
        }
      } catch (err) {
        logger.error('Token refresh failed:', err?.message);
        store.dispatch(logoutAsync());
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
