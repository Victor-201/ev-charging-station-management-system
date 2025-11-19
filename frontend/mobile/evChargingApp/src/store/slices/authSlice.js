// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../../config/constants';

export const login = createAsyncThunk('auth/login', async ({ email, password, remember }, { rejectWithValue, dispatch }) => {
  try {
    const data = await authService.login({ email, password });
    if (data?.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      if (remember) await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);

      // Fetch user profile after successful login
      try {
        const profile = await profileService.getMe();
        dispatch(setUserProfile(profile));
      } catch (profileErr) {
        console.warn('Failed to fetch user profile after login:', profileErr);
      }
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await authService.register(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const data = await authService.forgotPassword(email);
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
    const data = await authService.refreshToken(refresh);
    if (data?.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const socialLogin = createAsyncThunk('auth/socialLogin', async ({ provider, token }, { rejectWithValue, dispatch }) => {
  try {
    const data = await authService.socialLogin({ provider, provider_token: token });
    if (data?.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }

      // Fetch user profile after successful social login
      try {
        const profile = await profileService.getMe();
        dispatch(setUserProfile(profile));
      } catch (profileErr) {
        console.warn('Failed to fetch user profile after social login:', profileErr);
      }
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const fetchUserProfile = createAsyncThunk('auth/fetchUserProfile', async (_, { rejectWithValue }) => {
  try {
    const profile = await profileService.getMe();
    return profile;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const refreshToken = state.auth?.refreshToken || (await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    // Clear local storage
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    return { message: 'Logged out successfully' };
  } catch (err) {
    // Even if API call fails, clear local storage
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});



const initialState = {
  user: null,
  userProfile: null, // Full user profile from API
  accessToken: null,
  refreshToken: null,
  isNewUser: false, // Flag to indicate if user needs to complete profile
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
      state.userProfile = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isNewUser = false;
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    },
    setUserProfile(state, action) {
      state.userProfile = action.payload;
    },
    setIsNewUser(state, action) {
      state.isNewUser = action.payload;
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
        // Decode JWT to get user info
        if (a.payload?.accessToken) {
          try {
            s.user = jwtDecode(a.payload.accessToken);
          } catch (err) {
            console.error('Failed to decode JWT:', err);
            s.user = null;
          }
        } else {
          s.user = null;
        }
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
      .addCase(refreshToken.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Refresh failed'; })

      .addCase(socialLogin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(socialLogin.fulfilled, (s, a) => {
        s.loading = false;
        s.accessToken = a.payload?.accessToken ?? null;
        s.refreshToken = a.payload?.refreshToken ?? null;
        // Check if this is a new user
        s.isNewUser = a.payload?.is_new_user ?? false;
        // Decode JWT to get user info
        if (a.payload?.accessToken) {
          try {
            s.user = jwtDecode(a.payload.accessToken);
          } catch (err) {
            console.error('Failed to decode JWT:', err);
            s.user = null;
          }
        } else {
          s.user = null;
        }
      })
      .addCase(socialLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Social login failed'; })

      .addCase(logoutAsync.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(logoutAsync.fulfilled, (s) => {
        s.loading = false;
        s.user = null;
        s.accessToken = null;
        s.refreshToken = null;
      })
      .addCase(fetchUserProfile.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.userProfile = a.payload;
      })
      .addCase(fetchUserProfile.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload?.message || 'Failed to fetch profile';
      })

      .addCase(logoutAsync.rejected, (s) => {
        s.loading = false;
        // Even if logout fails, clear the state
        s.user = null;
        s.userProfile = null;
        s.accessToken = null;
        s.refreshToken = null;
      })

      
  },
});

export const { setAccessToken, logout, restoreSession, setUserProfile, setIsNewUser } = authSlice.actions;
export default authSlice.reducer;
