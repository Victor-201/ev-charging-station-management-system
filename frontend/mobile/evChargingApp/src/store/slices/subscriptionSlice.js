import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

// ==================== ASYNC THUNKS ====================

/**
 * Fetch all available subscription plans
 */
export const getAvailablePlans = createAsyncThunk(
  'subscriptions/getAvailablePlans',
  async (_, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.getAvailablePlans();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Fetch user's current subscriptions
 */
export const getSubscriptions = createAsyncThunk(
  'subscriptions/getSubscriptions',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.getSubscriptions(userId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Subscribe user to a plan
 */
export const subscribeToPlan = createAsyncThunk(
  'subscriptions/subscribeToPlan',
  async ({ userId, planId, autoRenew = true }, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.subscribeToPlan(userId, planId, autoRenew);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Cancel a subscription
 */
export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancelSubscription',
  async ({ userId, subscriptionId }, { rejectWithValue }) => {
    try {
      await subscriptionService.cancelSubscription(userId, subscriptionId);
      return subscriptionId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Available plans
  availablePlans: [],
  plansLoading: false,
  plansError: null,

  // User subscriptions
  subscriptions: [],
  subscriptionsLoading: false,
  subscriptionsError: null,

  // General loading state
  loading: false,
  error: null,
};

// ==================== SLICE ====================

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.plansError = null;
      state.subscriptionsError = null;
    },
  },
  extraReducers: (builder) => {
    // Get Available Plans
    builder
      .addCase(getAvailablePlans.pending, (state) => {
        state.plansLoading = true;
        state.plansError = null;
      })
      .addCase(getAvailablePlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.availablePlans = action.payload;
      })
      .addCase(getAvailablePlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.plansError = action.payload?.message || 'Failed to fetch plans';
      });

    // Get Subscriptions
    builder
      .addCase(getSubscriptions.pending, (state) => {
        state.subscriptionsLoading = true;
        state.subscriptionsError = null;
      })
      .addCase(getSubscriptions.fulfilled, (state, action) => {
        state.subscriptionsLoading = false;
        state.subscriptions = action.payload?.subscriptions || [];
      })
      .addCase(getSubscriptions.rejected, (state, action) => {
        state.subscriptionsLoading = false;
        state.subscriptionsError = action.payload?.message || 'Failed to fetch subscriptions';
      });

    // Subscribe to Plan
    builder
      .addCase(subscribeToPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh subscriptions after successful subscription
        if (action.payload?.subscription_id) {
          state.subscriptions.push(action.payload);
        }
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to subscribe to plan';
      });

    // Cancel Subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = state.subscriptions.filter(s => s.subscription_id !== action.payload);
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel subscription';
      });
  },
});

export const { clearError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

