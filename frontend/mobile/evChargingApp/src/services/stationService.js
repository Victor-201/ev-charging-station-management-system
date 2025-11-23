import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const stationService = {
  searchStations: async (latitude, longitude, radius, filters = {}) => {
    try {
      const params = {
        latitude: String(latitude),
        longitude: String(longitude),
        radius: String(radius),
        ...filters,
      };
      const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, { params });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[stationService] searchStations error:', error);
      throw error;
    }
  },

  getAllStations: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.STATION.LIST);
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[stationService] getAllStations error:', error);
      throw error;
    }
  },

  getStationById: async (stationId) => {
    try {
      const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[stationService] getStationById error:', error);
      throw error;
    }
  },

  getStationConnectors: async (stationId) => {
    try {
      const url = ENDPOINTS.STATION.CONNECTORS.replace(':id', stationId);
      const response = await apiClient.get(url);
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[stationService] getStationConnectors error:', error);
      throw error;
    }
  },

  getStationPricing: async (stationId) => {
    try {
      const url = ENDPOINTS.STATION.PRICING.replace(':id', stationId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[stationService] getStationPricing error:', error);
      throw error;
    }
  },

  reportIssue: async (stationId, issueData) => {
    try {
      const url = ENDPOINTS.STATION.REPORT_ISSUE.replace(':id', stationId);
      const response = await apiClient.post(url, issueData);
      return response.data;
    } catch (error) {
      console.error('[stationService] reportIssue error:', error);
      throw error;
    }
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};

export default stationService;
