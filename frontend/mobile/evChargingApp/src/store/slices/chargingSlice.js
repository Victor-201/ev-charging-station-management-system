import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chargingService from '../../services/chargingService';

// Async thunk for fetching user's charging history
export const getChargingHistory = createAsyncThunk('charging/getHistory', async (userId, { rejectWithValue }) => {
  try {
    const response = await chargingService.getHistory(userId);
    // Handle different response structures
    const sessions = response?.data?.sessions || response?.sessions || response?.data || response || [];
    return Array.isArray(sessions) ? sessions : [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const initiateCharging = createAsyncThunk('charging/initiate', async (bookingId, { rejectWithValue }) => {
  try {
    const { data } = await chargingService.initiate(bookingId);
    return data.session;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const handleChargingAction = createAsyncThunk('charging/handleAction', async ({ action, sessionId }, { rejectWithValue }) => {
  try {
    const { data } = await chargingService[action](sessionId);
    return data; // Assuming API returns the updated session
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
    updateTelemetry(state, action) {
      if (state.activeSession && state.activeSession.id === action.payload.sessionId) {
        state.telemetry = action.payload.telemetry;
        // Also update the active session with the latest data
        state.activeSession = { ...state.activeSession, ...action.payload.telemetry };
      }
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
      })

      // Initiate Charging
      .addCase(initiateCharging.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateCharging.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(initiateCharging.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to initiate session';
      })

      // Handle other actions (start, pause, resume, stop)
      .addCase(handleChargingAction.pending, () => {
        // Optionally handle loading state for specific actions
      })
      .addCase(handleChargingAction.fulfilled, (state, action) => {
        if (state.activeSession && state.activeSession.id === action.payload.session.id) {
          state.activeSession = action.payload.session;
        }
      })
      .addCase(handleChargingAction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Charging action failed';
      });
  },
});

export const { clearChargingState, updateTelemetry } = chargingSlice.actions;
export default chargingSlice.reducer;
