import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chargingService from '../../services/chargingService';

// Async thunk for fetching user's charging history
export const getChargingHistory = createAsyncThunk('charging/getHistory', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await chargingService.getHistory(userId);
    return data.sessions;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  sessions: [],
  activeSession: null,
  telemetry: null,
  loading: false,
  error: null,
};

const chargingSlice = createSlice({
  name: 'charging',
  initialState,
  reducers: {
    clearChargingState(state) {
      state.sessions = [];
      state.activeSession = null;
      state.telemetry = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Charging History
      .addCase(getChargingHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChargingHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(getChargingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch charging history';
      });
  },
});

export const { clearChargingState } = chargingSlice.actions;
export default chargingSlice.reducer;
