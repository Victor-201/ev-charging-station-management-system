// src/contexts/AuthProvider.jsx
import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext"; // đường dẫn đến file bạn đã tạo
import authService from "@/services/authService"; // đường dẫn tới file service của bạn
import apiClient from "@/api/apiClient"; // axios instance

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * AuthProvider
 * Cách dùng:
 *  <AuthProvider>
 *    <App />
 *  </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY) || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(REFRESH_TOKEN_KEY) || null
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // tránh multi refresh

  // Lưu token vào state + localStorage
  const persistTokens = (access, refresh) => {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      setAccessToken(access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setAccessToken(null);
    }

    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      setRefreshToken(refresh);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setRefreshToken(null);
    }
  };

  // Gọi API /auth/me để lấy thông tin user hiện tại
  const getMe = useCallback(async () => {
    try {
      const res = await authService.me();
      // tuỳ backend, có thể res.data hoặc res.data.user
      const payload = res?.data ?? res;
      setUser(payload?.user ?? payload);
      return payload;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  // Refresh token
  const refreshTokens = useCallback(async () => {
    if (!refreshToken || isRefreshing) return null;
    try {
      setIsRefreshing(true);
      const res = await authService.refreshToken({ refresh_token: refreshToken });
      const data = res?.data ?? res;
      // Giả sử backend trả { access_token, refresh_token, user? }
      const newAccess = data?.access_token ?? data?.accessToken ?? null;
      const newRefresh = data?.refresh_token ?? data?.refreshToken ?? null;

      if (newAccess || newRefresh) {
        persistTokens(newAccess ?? accessToken, newRefresh ?? refreshToken);
      }
      setIsRefreshing(false);
      return { access: newAccess, refresh: newRefresh, raw: data };
    } catch (err) {
      setIsRefreshing(false);
      // không thể refresh -> logout local
      persistTokens(null, null);
      setUser(null);
      return null;
    }
  }, [refreshToken, isRefreshing, accessToken]);

  // Login
  const login = async (payload) => {
    const res = await authService.login(payload);
    const data = res?.data ?? res;
    // tùy trả về của backend
    const newAccess = data?.access_token ?? data?.accessToken ?? data?.token ?? null;
    const newRefresh = data?.refresh_token ?? data?.refreshToken ?? null;
    const me = data?.user ?? null;

    persistTokens(newAccess, newRefresh);
    if (me) setUser(me);
    else await getMe(); // nếu backend không trả user, gọi /me
    return data;
  };

  // Logout
  const logout = async (payload) => {
    try {
      // Gọi backend revoke nếu cần
      await authService.logout(payload).catch(() => {});
    } catch (err) {
      // ignore
    } finally {
      persistTokens(null, null);
      setUser(null);
    }
  };

  // Register
  const register = async (payload) => {
    const res = await authService.register(payload);
    return res?.data ?? res;
  };

  // Verify OTP
  const verify = async (payload) => {
    const res = await authService.verify(payload);
    return res?.data ?? res;
  };

  // Thiết lập interceptor axios để gắn token và xử lý 401
  useEffect(() => {
    // request interceptor: attach token
    const reqInterceptor = apiClient.interceptors.request.use(
      (config) => {
        if (!config.headers) config.headers = {};
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // response interceptor: handle 401 -> try refresh once
    const resInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        // tránh loop: thêm flag _retry
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshTokens();
          if (refreshed && (refreshed.access || accessToken)) {
            const newAccess = refreshed.access ?? accessToken;
            if (!originalRequest.headers) originalRequest.headers = {};
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(reqInterceptor);
      apiClient.interceptors.response.eject(resInterceptor);
    };
  }, [accessToken, refreshTokens]);

  // khi mount: nếu có accessToken -> gọi getMe
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (accessToken) {
        try {
          await getMe();
        } catch (err) {
          // nếu token lỗi -> thử refresh
          const r = await refreshTokens();
          if (r?.access) {
            try {
              await getMe();
            } catch {
              // ignore
            }
          }
        }
      }
      if (mounted) setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chạy 1 lần khi mount

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    login,
    logout,
    register,
    verify,
    refreshTokens,
    getMe,
    setUser, // có thể dùng để cập nhật profile local
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
