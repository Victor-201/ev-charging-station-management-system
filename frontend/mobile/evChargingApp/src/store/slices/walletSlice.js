import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';

// Async thunk for fetching wallet data
export const getWallet = createAsyncThunk('wallet/getWallet', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await paymentService.getWallet(userId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Async thunk for fetching transactions
export const getTransactions = createAsyncThunk('wallet/getTransactions', async ({ userId, params }, { rejectWithValue }) => {
  try {
    const response = await paymentService.getTransactions(userId, params);
    // Handle different response structures (e.g., response.data, response.data.transactions, etc.)
    const transactions = response?.data?.transactions || response?.transactions || response?.data || response || [];
    return Array.isArray(transactions) ? transactions : [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const topupWallet = createAsyncThunk('wallet/topup', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await paymentService.topup(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const withdrawFromWallet = createAsyncThunk('wallet/withdraw', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await paymentService.withdraw(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  wallet: null,
  transactions: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // simple setter used by mock/front-end hooks
    fetchWalletSuccess: (state, action) => {
      state.wallet = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Wallet
      .addCase(getWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(getWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch wallet';
      })

      // Get Transactions
      .addCase(getTransactions.pending, () => {
        // Optionally handle loading state for transactions separately
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch transactions';
      })

      // Top-up Wallet
      .addCase(topupWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(topupWallet.fulfilled, (state, action) => {
        state.loading = false;
        if (state.wallet) {
          state.wallet.balance = action.payload.new_balance;
        }
        state.transactions.unshift(action.payload.transaction); // Add new transaction to the beginning
      })
      .addCase(topupWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Top-up failed';
      })

      // Withdraw from Wallet
      .addCase(withdrawFromWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawFromWallet.fulfilled, (state, action) => {
        state.loading = false;
        if (state.wallet) {
          state.wallet.balance = action.payload.new_balance;
        }
        state.transactions.unshift(action.payload.transaction);
      })
      .addCase(withdrawFromWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Withdrawal failed';
      });
  },
});

export const { fetchWalletSuccess } = walletSlice.actions;

export default walletSlice.reducer;

