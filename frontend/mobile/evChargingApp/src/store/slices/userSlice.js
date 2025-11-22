import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import profileService from '../../services/profileService';

// Async thunk for fetching user profile
export const getMe = createAsyncThunk('user/getMe', async (_, { rejectWithValue }) => {
  try {
    const data = await profileService.getMe();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk('user/updateProfile', async (profileData, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    const userId = state.user?.profile?.user_id || state.user?.profile?.id || state.auth?.user?.user_id || state.auth?.user?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await profileService.updateProfile(userId, profileData);
    return response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Async thunk for fetching all users (admin only)
export const getUsers = createAsyncThunk('user/getUsers', async (_, { rejectWithValue }) => {
  try {
    const data = await profileService.getAllUsers(); // This function needs to be added to profileService
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  profile: null,
  users: [], // Add users to state
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
    clearError(state) {
      state.error = null;
    },
    setProfile(state, action) {
      // Merge with existing profile to preserve important fields
      const existingProfile = state.profile || {};
      const newProfile = action.payload || {};
      
      state.profile = {
        ...existingProfile,
        ...newProfile,
        // Ensure full_name is preserved if not in new data
        full_name: newProfile.full_name || existingProfile.full_name,
      };
      
      console.log('[userSlice] setProfile - Merged:', {
        hadExisting: !!existingProfile.full_name,
        newHasFullName: !!newProfile.full_name,
        finalFullName: state.profile.full_name
      });
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
        
        // Merge with existing profile to preserve OAuth data like full_name
        // API /users/profile may not return full_name, but OAuth login does
        const existingProfile = state.profile || {};
        const newProfile = action.payload || {};
        
        state.profile = {
          ...newProfile,
          // Preserve full_name from OAuth if API doesn't provide it
          full_name: newProfile.full_name || existingProfile.full_name,
          // Preserve other OAuth fields that might be missing from API
          email_verified: newProfile.email_verified !== undefined ? newProfile.email_verified : existingProfile.email_verified,
        };
        
        console.log('[userSlice] getMe.fulfilled - Merged profile:', {
          hadExisting: !!existingProfile.full_name,
          apiHasFullName: !!newProfile.full_name,
          finalFullName: state.profile.full_name
        });
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
      .addCase(updateProfile.fulfilled, (state, _action) => {
        state.loading = false;
        // API returns { status: "updated" }, so we need to refetch profile
        // The profile will be updated when getMe is called after this
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update profile';
      })

      // GetUsers reducers
      .addCase(getUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.loading = false;
        state.users = [];
        state.error = action.payload?.message || 'Failed to fetch users';
      });
  },
});

export const { clearProfile, setProfile, clearError } = userSlice.actions;
export default userSlice.reducer;