import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vehicleService from '../../services/vehicleService';

// Thunks for vehicle actions
export const getVehicles = createAsyncThunk('vehicles/getVehicles', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await vehicleService.getVehicles(userId);
    return data.vehicles;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const addVehicle = createAsyncThunk('vehicles/addVehicle', async ({ userId, vehicleData }, { rejectWithValue }) => {
  try {
    const { data } = await vehicleService.addVehicle(userId, vehicleData);
    return data.vehicle;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const updateVehicle = createAsyncThunk('vehicles/updateVehicle', async ({ vehicleId, vehicleData }, { rejectWithValue }) => {
  try {
    const { data } = await vehicleService.updateVehicle(vehicleId, vehicleData);
    return data.vehicle;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const deleteVehicle = createAsyncThunk('vehicles/deleteVehicle', async (vehicleId, { rejectWithValue }) => {
  try {
    await vehicleService.deleteVehicle(vehicleId);
    return vehicleId;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  vehicles: [],
  loading: false,
  error: null,
};

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get Vehicles
      .addCase(getVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(getVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch vehicles';
      })

      // Add Vehicle
      .addCase(addVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles.push(action.payload);
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add vehicle';
      })

      // Update Vehicle
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update vehicle';
      })

      // Delete Vehicle
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete vehicle';
      });
  },
});

export default vehicleSlice.reducer;
