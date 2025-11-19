import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import apiClient from "@/api/apiClient";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ===== JWT Decode =====
const decodeJWT = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (err) {
    console.error("Decode JWT error:", err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY) || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(REFRESH_TOKEN_KEY) || null
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ===== Persist Tokens =====
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

  // ===== Optional: GET /me =====
  const getMe = useCallback(async () => {
    try {
      const res = await authService.me();
      const payload = res?.data ?? res;
      setUser(payload?.user ?? payload);
      return payload;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  // ===== Refresh Tokens =====
  const refreshTokens = useCallback(async () => {
    if (!refreshToken || isRefreshing) return null;

    try {
      setIsRefreshing(true);

      const res = await authService.refreshToken({
        refresh_token: refreshToken,
      });

      const data = res?.data ?? res;

      const newAccess = data?.access_token ?? data?.accessToken;
      const newRefresh = data?.refresh_token ?? data?.refreshToken;

      if (newAccess || newRefresh) {
        persistTokens(newAccess, newRefresh);
      }

      // auto decode again
      if (newAccess) {
        const decoded = decodeJWT(newAccess);
        if (decoded) {
          setUser({
            user_id: decoded.user_id,
            email: decoded.email,
            role: decoded.role,
          });
        }
      }

      setIsRefreshing(false);
      return data;
    } catch (err) {
      setIsRefreshing(false);

      // refresh failed → logout
      persistTokens(null, null);
      setUser(null);
      return null;
    }
  }, [refreshToken, isRefreshing]);

  // ===== Login =====
  const login = async (payload) => {
    const res = await authService.login(payload);
    const data = res?.data ?? res;

    const newAccess = data?.access_token ?? data?.accessToken ?? null;
    const newRefresh = data?.refresh_token ?? data?.refreshToken ?? null;

    persistTokens(newAccess, newRefresh);

    // Decode token to user
    const decoded = decodeJWT(newAccess);
    if (decoded) {
      setUser({
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
      });
    }

    return data;
  };

  // ===== Logout =====
  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      persistTokens(null, null);
      setUser(null);
    }
  };

  // ===== Register & Verify =====
  const register = async (payload) => {
    const res = await authService.register(payload);
    return res?.data ?? res;
  };

  const verify = async (payload) => {
    const res = await authService.verify(payload);
    return res?.data ?? res;
  };

  // ===== Axios Interceptors =====
  useEffect(() => {
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

    const resInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshTokens();

          if (refreshed?.access_token || refreshed?.accessToken) {
            const newAccess =
              refreshed.access_token ?? refreshed.accessToken ?? accessToken;

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

  // ===== Init User on Page Reload =====
  useEffect(() => {
    if (accessToken) {
      const decoded = decodeJWT(accessToken);
      if (decoded) {
        setUser({
          user_id: decoded.user_id,
          email: decoded.email,
          role: decoded.role,
        });
      }
    }

    setLoading(false);
  }, []);

  // ===== Provider Value =====
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
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;