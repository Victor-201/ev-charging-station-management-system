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

export const startCharging = createAsyncThunk('charging/start', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.start(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const stopCharging = createAsyncThunk('charging/stop', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.stop(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const pauseCharging = createAsyncThunk('charging/pause', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.pause(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const resumeCharging = createAsyncThunk('charging/resume', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.resume(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getSessionDetail = createAsyncThunk('charging/getSession', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.getSession(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getSessionTelemetry = createAsyncThunk('charging/getTelemetry', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.getTelemetry(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getInvoice = createAsyncThunk('charging/getInvoice', async (sessionId, { rejectWithValue }) => {
  try {
    const response = await chargingService.getInvoice(sessionId);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const confirmPayment = createAsyncThunk('charging/confirmPayment', async ({ sessionId, paymentData }, { rejectWithValue }) => {
  try {
    const response = await chargingService.confirmPayment(sessionId, paymentData);
    return response?.data || response;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  sessions: [],
  activeSession: null,
  currentSession: null,
  telemetry: null,
  invoice: null,
  loading: false,
  error: null,
  historyLoading: false,
  telemetryLoading: false,
  invoiceLoading: false,
};

const chargingSlice = createSlice({
  name: 'charging',
  initialState,
  reducers: {
    clearChargingState(state) {
      state.sessions = [];
      state.activeSession = null;
      state.currentSession = null;
      state.telemetry = null;
      state.invoice = null;
      state.loading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    updateTelemetry(state, action) {
      state.telemetry = action.payload;
      if (state.activeSession) {
        state.activeSession = { ...state.activeSession, ...action.payload };
      }
    },
    setActiveSession(state, action) {
      state.activeSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Charging History
      .addCase(getChargingHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(getChargingHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.sessions = action.payload;
      })
      .addCase(getChargingHistory.rejected, (state, action) => {
        state.historyLoading = false;
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

      // Start Charging
      .addCase(startCharging.pending, (state) => {
        state.loading = true;
      })
      .addCase(startCharging.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(startCharging.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start charging';
      })

      // Stop Charging
      .addCase(stopCharging.pending, (state) => {
        state.loading = true;
      })
      .addCase(stopCharging.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = null;
        state.currentSession = action.payload;
      })
      .addCase(stopCharging.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to stop charging';
      })

      // Pause Charging
      .addCase(pauseCharging.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(pauseCharging.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to pause charging';
      })

      // Resume Charging
      .addCase(resumeCharging.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(resumeCharging.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to resume charging';
      })

      // Get Session Detail
      .addCase(getSessionDetail.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })

      // Get Telemetry
      .addCase(getSessionTelemetry.pending, (state) => {
        state.telemetryLoading = true;
      })
      .addCase(getSessionTelemetry.fulfilled, (state, action) => {
        state.telemetryLoading = false;
        state.telemetry = action.payload;
      })
      .addCase(getSessionTelemetry.rejected, (state) => {
        state.telemetryLoading = false;
      })

      // Get Invoice
      .addCase(getInvoice.pending, (state) => {
        state.invoiceLoading = true;
      })
      .addCase(getInvoice.fulfilled, (state, action) => {
        state.invoiceLoading = false;
        state.invoice = action.payload;
      })
      .addCase(getInvoice.rejected, (state, action) => {
        state.invoiceLoading = false;
        state.error = action.payload?.message || 'Failed to get invoice';
      })

      // Confirm Payment
      .addCase(confirmPayment.fulfilled, (state, action) => {
        if (state.currentSession) {
          state.currentSession = action.payload;
        }
      });
  },
});

export const { clearChargingState, clearError, updateTelemetry, setActiveSession } = chargingSlice.actions;
export default chargingSlice.reducer;
