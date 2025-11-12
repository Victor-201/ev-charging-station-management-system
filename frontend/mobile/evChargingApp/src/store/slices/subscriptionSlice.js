import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

// Thunks for subscription actions
export const getSubscriptions = createAsyncThunk('subscriptions/getSubscriptions', async (userId, { rejectWithValue }) => {
  try {
    const data = await subscriptionService.getSubscriptions(userId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const subscribeToPlan = createAsyncThunk('subscriptions/subscribeToPlan', async ({ userId, planId }, { rejectWithValue }) => {
  try {
    const data = await subscriptionService.subscribeToPlan(userId, planId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const cancelSubscription = createAsyncThunk('subscriptions/cancelSubscription', async ({ userId, subscriptionId }, { rejectWithValue }) => {
  try {
    await subscriptionService.cancelSubscription(userId, subscriptionId);
    return subscriptionId;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  subscriptions: [],
  loading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload;
      })
      .addCase(getSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch subscriptions';
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.subscriptions.push(action.payload);
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.subscriptions = state.subscriptions.filter(s => s.id !== action.payload);
      });
  },
});

export default subscriptionSlice.reducer;

