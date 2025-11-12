import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import stationService from '../../services/stationService';

// Thunks for station actions
export const searchStations = createAsyncThunk('stations/searchStations', async (queryParams, { rejectWithValue }) => {
  try {
    const data = await stationService.searchStations(queryParams);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getStationById = createAsyncThunk('stations/getStationById', async (stationId, { rejectWithValue }) => {
  try {
    const data = await stationService.getStationById(stationId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getStationPricing = createAsyncThunk('stations/getStationPricing', async (stationId, { rejectWithValue }) => {
  try {
    const data = await stationService.getPricing(stationId);
    return { stationId, pricing: data };
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  stations: [],
  selectedStation: null,
  loading: false,
  error: null,
};

const stationSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    clearSelectedStation(state) {
      state.selectedStation = null;
    },
    setSelectedStation(state, action) {
      state.selectedStation = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Stations
      .addCase(searchStations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.stations = action.payload;
      })

      // Get Station Pricing
      .addCase(getStationPricing.fulfilled, (state, action) => {
        if (state.selectedStation && state.selectedStation.id === action.payload.stationId) {
          state.selectedStation.pricing = action.payload.pricing;
        }
      })

      .addCase(searchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to search stations';
      })

      // Get Station By ID
      .addCase(getStationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStationById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStation = action.payload;
      })
      .addCase(getStationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch station details';
      });
  },
});

export const { clearSelectedStation } = stationSlice.actions;
export default stationSlice.reducer;

