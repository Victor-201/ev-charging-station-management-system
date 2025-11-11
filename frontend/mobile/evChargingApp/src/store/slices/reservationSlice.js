import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reservationService from '../../services/reservationService';

// Async thunk for fetching available time slots
export const getAvailableSlots = createAsyncThunk(
  'reservation/getAvailableSlots',
  async ({ stationId, date }, { rejectWithValue }) => {
    try {
      const response = await reservationService.getAvailableSlots(stationId, date);
      const slots = response?.data?.slots || response?.slots || response?.data || response || [];
      return Array.isArray(slots) ? slots : [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for creating a new reservation
export const createReservation = createAsyncThunk(
  'reservation/create',
  async (reservationData, { rejectWithValue }) => {
    try {
      const response = await reservationService.create(reservationData);
      return response?.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for fetching user's reservations
export const getUserReservations = createAsyncThunk(
  'reservation/getUserReservations',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await reservationService.getUserReservations(userId);
      const reservations = response?.data?.reservations || response?.reservations || response?.data || response || [];
      return Array.isArray(reservations) ? reservations : [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for fetching a specific reservation
export const getReservationById = createAsyncThunk(
  'reservation/getById',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await reservationService.getById(reservationId);
      return response?.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for cancelling a reservation
export const cancelReservation = createAsyncThunk(
  'reservation/cancel',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await reservationService.cancel(reservationId);
      return { reservationId, ...response?.data || response };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for previewing reservation cost
export const previewReservationCost = createAsyncThunk(
  'reservation/previewCost',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await reservationService.previewCost(reservationId);
      return response?.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for finalizing a reservation
export const finalizeReservation = createAsyncThunk(
  'reservation/finalize',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await reservationService.finalize(reservationId);
      return { reservationId, ...response?.data || response };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const initialState = {
  reservations: [],
  currentReservation: null,
  availableSlots: [],
  costPreview: null,
  loading: false,
  slotsLoading: false,
  error: null,
};

const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    clearReservationState(state) {
      state.reservations = [];
      state.currentReservation = null;
      state.availableSlots = [];
      state.costPreview = null;
      state.loading = false;
      state.slotsLoading = false;
      state.error = null;
    },
    clearCurrentReservation(state) {
      state.currentReservation = null;
      state.costPreview = null;
    },
    clearAvailableSlots(state) {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Available Slots
      .addCase(getAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
        state.error = null;
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.slotsLoading = false;
        state.error = action.payload?.message || 'Failed to fetch available slots';
      })

      // Create Reservation
      .addCase(createReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReservation = action.payload;
        // Add to reservations list if not already present
        const exists = state.reservations.find(
          (r) => r.id === action.payload.id || r.reservation_id === action.payload.id
        );
        if (!exists) {
          state.reservations.unshift(action.payload);
        }
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create reservation';
      })

      // Get User Reservations
      .addCase(getUserReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = action.payload;
      })
      .addCase(getUserReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch reservations';
      })

      // Get Reservation By ID
      .addCase(getReservationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReservationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReservation = action.payload;
      })
      .addCase(getReservationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch reservation details';
      })

      // Cancel Reservation
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.loading = false;
        // Update reservation in list
        const index = state.reservations.findIndex(
          (r) => r.id === action.payload.reservationId || r.reservation_id === action.payload.reservationId
        );
        if (index !== -1) {
          state.reservations[index] = { ...state.reservations[index], status: 'cancelled' };
        }
        // Update current reservation if it's the one being cancelled
        if (state.currentReservation?.id === action.payload.reservationId) {
          state.currentReservation = { ...state.currentReservation, status: 'cancelled' };
        }
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel reservation';
      })

      // Preview Reservation Cost
      .addCase(previewReservationCost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(previewReservationCost.fulfilled, (state, action) => {
        state.loading = false;
        state.costPreview = action.payload;
      })
      .addCase(previewReservationCost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to preview cost';
      })

      // Finalize Reservation
      .addCase(finalizeReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeReservation.fulfilled, (state, action) => {
        state.loading = false;
        // Update reservation in list
        const index = state.reservations.findIndex(
          (r) => r.id === action.payload.reservationId || r.reservation_id === action.payload.reservationId
        );
        if (index !== -1) {
          state.reservations[index] = { ...state.reservations[index], status: 'confirmed' };
        }
        // Update current reservation
        if (state.currentReservation?.id === action.payload.reservationId) {
          state.currentReservation = { ...state.currentReservation, status: 'confirmed' };
        }
      })
      .addCase(finalizeReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to finalize reservation';
      });
  },
});

export const { clearReservationState, clearCurrentReservation, clearAvailableSlots } = reservationSlice.actions;

export default reservationSlice.reducer;
