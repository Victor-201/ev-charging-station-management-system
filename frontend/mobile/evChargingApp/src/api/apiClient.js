// src/api/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import store from '../store/store';
import { setAccessToken, logout } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../config/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
    // ignore
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refreshToken = store.getState().auth?.refreshToken || (await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}${'/auth/refresh'}`, { refreshToken });
        if (data?.accessToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
          if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
          store.dispatch(setAccessToken(data.accessToken));
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        }
      } catch (err) {
        store.dispatch(logout());
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
