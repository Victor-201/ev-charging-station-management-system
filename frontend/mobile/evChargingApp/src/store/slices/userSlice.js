import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import profileService from '../../services/profileService';

// Async thunk for fetching user profile
export const getMe = createAsyncThunk('user/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await profileService.getMe();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk('user/updateProfile', async ({ userId, profileData }, { rejectWithValue }) => {
  try {
    const { data } = await profileService.updateProfile(userId, profileData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch profile';
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.user; // Assuming the API returns the updated user object
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update profile';
      });
  },
});

export const { clearProfile } = userSlice.actions;
export default userSlice.reducer;