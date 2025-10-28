// src/api/auth.api.js
import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = 'access_token';
const KEY_REFRESH = 'refresh_token';

/**
 * Auth endpoints (đúng theo list bạn cung cấp)
 * POST /api/v1/auth/register
 * POST /api/v1/auth/verify
 * POST /api/v1/auth/login
 * POST /api/v1/auth/login/oauth
 * POST /api/v1/auth/refresh-token
 * POST /api/v1/auth/logout
 * POST /api/v1/auth/forgot-password
 * POST /api/v1/auth/reset-password
 * POST /api/v1/auth/link-provider
 * POST /api/v1/auth/unlink-provider
 *
 * User profile:
 * GET /api/v1/auth/me
 *
 * Các hàm dưới đây lưu/xóa token vào AsyncStorage tương ứng.
 */

const saveTokens = async ({ accessToken, refreshToken }) => {
  try {
    if (accessToken) await AsyncStorage.setItem(KEY_ACCESS, accessToken);
    if (refreshToken) await AsyncStorage.setItem(KEY_REFRESH, refreshToken);
  } catch (e) {}
};

const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(KEY_ACCESS);
    await AsyncStorage.removeItem(KEY_REFRESH);
  } catch (e) {}
};

export const register = async (payload) => {
  const res = await client.post('/auth/register', payload);
  return res.data;
};

export const verify = async (payload) => {
  const res = await client.post('/auth/verify', payload);
  return res.data;
};

export const login = async (payload) => {
  const res = await client.post('/auth/login', payload);
  const data = res.data;
  if (data?.accessToken || data?.refreshToken) await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
};

export const loginWithOAuth = async (payload) => {
  const res = await client.post('/auth/login/oauth', payload);
  const data = res.data;
  if (data?.accessToken || data?.refreshToken) await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
};

export const refreshToken = async (payload) => {
  const res = await client.post('/auth/refresh-token', payload);
  const data = res.data;
  if (data?.accessToken || data?.refreshToken) await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
};

export const logout = async (payload = {}) => {
  try {
    await client.post('/auth/logout', payload);
  } catch (e) {
    // ignore network error
  } finally {
    await clearTokens();
  }
};

export const forgotPassword = async (payload) => {
  const res = await client.post('/auth/forgot-password', payload);
  return res.data;
};

export const resetPassword = async (payload) => {
  const res = await client.post('/auth/reset-password', payload);
  return res.data;
};

export const linkProvider = async (payload) => {
  const res = await client.post('/auth/link-provider', payload);
  return res.data;
};

export const unlinkProvider = async (payload) => {
  const res = await client.post('/auth/unlink-provider', payload);
  return res.data;
};

/* User profile endpoint (me) */
export const getProfile = async () => {
  const res = await client.get('/auth/me');
  return res.data;
};
