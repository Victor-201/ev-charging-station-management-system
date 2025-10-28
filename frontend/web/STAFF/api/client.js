// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Axios client cấu hình sẵn cho API endpoints dạng /api/v1/...
 * - Thay BASE_URL nếu backend khác
 * - Interceptor sẽ attach access token từ AsyncStorage
 * - Response interceptor thử refresh token khi gặp 401
 */

const BASE_URL = 'http://localhost:3000'; // <-- đổi thành backend của bạn (ví dụ https://api.example.com)
const API_PREFIX = '/api/v1';

const client = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKENS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
};

const storage = {
  getAccess: async () => {
    try { return await AsyncStorage.getItem(TOKENS.ACCESS); } catch { return null; }
  },
  getRefresh: async () => {
    try { return await AsyncStorage.getItem(TOKENS.REFRESH); } catch { return null; }
  },
  setAccess: async (t) => { try { await AsyncStorage.setItem(TOKENS.ACCESS, t); } catch {} },
  setRefresh: async (t) => { try { await AsyncStorage.setItem(TOKENS.REFRESH, t); } catch {} },
  clear: async () => { try { await AsyncStorage.removeItem(TOKENS.ACCESS); await AsyncStorage.removeItem(TOKENS.REFRESH); } catch {} },
};

// request interceptor: attach token
client.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
}, (err) => Promise.reject(err));

// response interceptor: on 401 try refresh once
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!error.response) return Promise.reject(error);
    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getRefresh();
        if (!refreshToken) {
          await storage.clear();
          return Promise.reject(error);
        }
        // Call refresh endpoint (exact path /auth/refresh-token)
        const r = await axios.post(`${BASE_URL}${API_PREFIX}/auth/refresh-token`, { refreshToken }, { headers: { 'Content-Type': 'application/json' } });
        const data = r.data || {};
        if (data?.accessToken) {
          await storage.setAccess(data.accessToken);
          if (data?.refreshToken) await storage.setRefresh(data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(original);
        } else {
          await storage.clear();
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        await storage.clear();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
