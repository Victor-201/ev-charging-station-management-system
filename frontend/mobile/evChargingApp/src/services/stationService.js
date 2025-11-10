// src/services/stationService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const stationService = {
  // Get all stations with optional filters
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, { params });
    return response.data;
  },

  // Get station by ID
  getById: async (stationId) => {
    const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get nearby stations based on coordinates
  getNearby: async (latitude, longitude, radius = 10) => {
    const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, {
      params: { lat: latitude, lng: longitude, radius }
    });
    return response.data;
  },

  // Get station availability
  getAvailability: async (stationId) => {
    const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
    const response = await apiClient.get(url);
    // Extract availability info from station data
    const station = response.data;
    return {
      station_id: stationId,
      available_ports: station.available_chargers || 0,
      total_ports: station.total_chargers || 0,
    };
  },

  // Get station connectors
  getConnectors: async (stationId) => {
    const url = ENDPOINTS.STATION.CONNECTORS.replace(':id', stationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Report station issue
  reportIssue: async (stationId, payload) => {
    const url = ENDPOINTS.STATION.REPORT_ISSUE.replace(':id', stationId);
    const response = await apiClient.post(url, payload);
    return response.data;
  },

  // Get station pricing
  getPricing: async (stationId) => {
    const url = ENDPOINTS.STATION.PRICING.replace(':id', stationId);
    const response = await apiClient.get(url);
    return response.data;
  },
};

export default stationService;
