import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';

export const createPayment = createAsyncThunk('payment/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await paymentService.createPayment(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getInvoice = createAsyncThunk('payment/getInvoice', async (invoiceId, { rejectWithValue }) => {
  try {
    const { data } = await paymentService.getInvoice(invoiceId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const downloadInvoice = createAsyncThunk('payment/downloadInvoice', async (invoiceId, { rejectWithValue }) => {
  try {
    // This would typically return a blob or file stream
    const response = await paymentService.downloadInvoice(invoiceId);
    return response.data; // Assuming data is the file content
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  invoice: null,
  paymentResult: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentResult = action.payload;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Payment failed';
        state.paymentResult = null;
      })

      // Get Invoice
      .addCase(getInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoice = action.payload;
      })
      .addCase(getInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch invoice';
      })

      // Download Invoice
      .addCase(downloadInvoice.pending, (state) => {
        state.loading = true;
      })
      .addCase(downloadInvoice.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to download invoice';
      });
  },
});

export default paymentSlice.reducer;
