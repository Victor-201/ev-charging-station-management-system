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

export const getStationConnectors = createAsyncThunk('stations/getStationConnectors', async (stationId, { rejectWithValue }) => {
  try {
    const data = await stationService.getConnectors(stationId);
    // The data from this endpoint is expected to be an array of connector types, e.g., ["Type2", "CCS2"]
    return { stationId, connectors: data };
  } catch (err) {
    // It's okay if this fails, the main station data might still have the info
    console.warn('Could not fetch dedicated connectors endpoint:', err.message);
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

      // Get Station Connectors
      .addCase(getStationConnectors.fulfilled, (state, action) => {
        if (state.selectedStation && state.selectedStation.id === action.payload.stationId) {
          const newPoints = action.payload.connectors || [];
          if (Array.isArray(newPoints) && newPoints.length > 0) {
            const existingPoints = state.selectedStation.charging_points || [];
            const existingPointIds = new Set(existingPoints.map(p => p.point_id));

            newPoints.forEach(point => {
              if (point.point_id && !existingPointIds.has(point.point_id)) {
                existingPoints.push(point);
                existingPointIds.add(point.point_id);
              }
            });

            // Update charging points
            state.selectedStation.charging_points = existingPoints;

            // Recalculate totals and connector types from the definitive list of points
            state.selectedStation.total_ports = existingPoints.length;
            state.selectedStation.available_ports = existingPoints.filter(p => p.status === 'available').length;
            const allConnectorTypes = new Set(existingPoints.map(p => p.type).filter(Boolean));
            state.selectedStation.connector_types = Array.from(allConnectorTypes);
          }
        }
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

export const { clearSelectedStation, setSelectedStation } = stationSlice.actions;
export default stationSlice.reducer;

