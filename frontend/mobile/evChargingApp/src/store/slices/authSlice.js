// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/authService';
import jwtDecode from 'jwt-decode';
import { STORAGE_KEYS } from '../../config/constants';

export const login = createAsyncThunk('auth/login', async ({ email, password, remember }, { rejectWithValue }) => {
  try {
    const { data } = await authService.login({ email, password });
    if (data?.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      if (remember) await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authService.register(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const { data } = await authService.forgotPassword(email);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const refreshToken = createAsyncThunk('auth/refreshToken', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const refresh = state.auth?.refreshToken || (await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
    if (!refresh) throw new Error('No refresh token');
    const { data } = await authService.refreshToken(refresh);
    if (data?.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action) {
      state.accessToken = action.payload;
      try {
        state.user = jwtDecode(action.payload);
      } catch {
        state.user = null;
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    },
    restoreSession(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      try {
        state.user = jwtDecode(action.payload.accessToken);
      } catch {
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.accessToken = a.payload?.accessToken ?? null;
        s.refreshToken = a.payload?.refreshToken ?? null;
        try { s.user = a.payload?.accessToken ? jwtDecode(a.payload.accessToken) : null; } catch { s.user = null; }
      })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Login failed'; })

      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s) => { s.loading = false; })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Register failed'; })

      .addCase(forgotPassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(forgotPassword.fulfilled, (s) => { s.loading = false; })
      .addCase(forgotPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Request failed'; })

      .addCase(refreshToken.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(refreshToken.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload?.accessToken) {
          s.accessToken = a.payload.accessToken;
          if (a.payload.refreshToken) s.refreshToken = a.payload.refreshToken;
          try { s.user = jwtDecode(a.payload.accessToken); } catch { s.user = null; }
        }
      })
      .addCase(refreshToken.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Refresh failed'; });
  },
});

export const { setAccessToken, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
