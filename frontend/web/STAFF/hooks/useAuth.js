// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AuthProvider + useAuth hook
 * - Quản lý user, isAuthenticated, loading, error
 * - Cung cấp login/logout/register/refresh/getProfile...
 *
 * Usage:
 *  - Wrap <AuthProvider> ở root App.js
 *  - Inside screens: const { user, login, logout, loading } = useAuth();
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial loading: check stored token
  const [error, setError] = useState(null);

  useEffect(() => {
    // on mount, try to fetch profile if token exists
    let mounted = true;
    const init = async () => {
      try {
        // try GET /auth/me (client will attach token if exists)
        const profile = await authApi.getProfile();
        if (!mounted) return;
        setUser(profile?.data ?? profile); // some backend wraps in {data:...}
      } catch (e) {
        // no valid session
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => (mounted = false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      // backend may return user inside res
      // try to fetch profile if not included
      let profile = res?.user || res?.data?.user;
      if (!profile) {
        try {
          const p = await authApi.getProfile();
          profile = p?.data ?? p;
        } catch (e) {
          profile = null;
        }
      }
      setUser(profile);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOAuth = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.loginWithOAuth(payload);
      let profile = res?.user || res?.data?.user;
      if (!profile) {
        try {
          const p = await authApi.getProfile();
          profile = p?.data ?? p;
        } catch (e) {
          profile = null;
        }
      }
      setUser(profile);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verify = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.verify(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.refreshToken(payload);
      // optionally update profile
      try {
        const p = await authApi.getProfile();
        setUser(p?.data ?? p);
      } catch (e) {}
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (payload = {}) => {
    setLoading(true);
    try {
      await authApi.logout(payload);
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const forgotPassword = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.resetPassword(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const linkProvider = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.linkProvider(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unlinkProvider = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.unlinkProvider(payload);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.updateProfile(payload);
      // refresh local profile
      try {
        const p = await authApi.getProfile();
        setUser(p?.data ?? p);
      } catch (e) {}
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        login,
        loginWithOAuth,
        register,
        verify,
        refresh,
        logout,
        forgotPassword,
        resetPassword,
        linkProvider,
        unlinkProvider,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
