// src/services/stationService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Fix double-encoded UTF-8 text (backend database issue workaround)
 * The backend database has incorrectly stored Vietnamese text.
 * This attempts to fix it on the client side.
 */
const fixTextEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;

  try {
    // Check if text contains mojibake patterns (double-encoded UTF-8)
    // Common patterns: Ã¡, Ã©, Ã­, Ã³, Ãº, etc.
    if (/[ÃÂ][¡-¿]/.test(text)) {
      // This is a known backend issue - text is double-encoded
      // Unfortunately, we cannot reliably fix this on the client side
      // because the data is already corrupted in the database
      console.warn('Detected corrupted Vietnamese text encoding:', text);

      // Return as-is - backend needs to fix the database
      return text;
    }

    return text;
  } catch (error) {
    console.error('Error fixing text encoding:', error);
    return text;
  }
};

/**
 * Transform station data from API response
 * - Parse latitude/longitude from string to number
 * - Fix text encoding issues (workaround for backend bug)
 * - Ensure proper data types for all fields
 */
const transformStationData = (station) => {
  if (!station) return null;

  // Parse connector_types - can be array, string, or null
  let connectorTypes = [];
  if (station.connector_types) {
    if (Array.isArray(station.connector_types)) {
      connectorTypes = station.connector_types;
    } else if (typeof station.connector_types === 'string') {
      try {
        // Try to parse as JSON array
        connectorTypes = JSON.parse(station.connector_types);
      } catch (e) {
        // If not JSON, split by comma
        connectorTypes = station.connector_types.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // Parse amenities - can be array, string, or null
  let amenities = [];
  if (station.amenities) {
    if (Array.isArray(station.amenities)) {
      amenities = station.amenities;
    } else if (typeof station.amenities === 'string') {
      try {
        // Try to parse as JSON array
        amenities = JSON.parse(station.amenities);
      } catch (e) {
        // If not JSON, split by comma
        amenities = station.amenities.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  return {
    ...station,
    // Fix text encoding (backend database issue)
    name: fixTextEncoding(station.name),
    address: fixTextEncoding(station.address),
    city: fixTextEncoding(station.city),
    region: fixTextEncoding(station.region),
    // Parse coordinates to numbers (API returns strings)
    latitude: parseFloat(station.latitude),
    longitude: parseFloat(station.longitude),
    // Parse numeric fields
    available_ports: parseInt(station.available_ports || 0, 10),
    total_ports: parseInt(station.total_ports || 0, 10),
    // Parse rating
    rating: parseFloat(station.rating || 0),
    // Parse price
    price_per_kwh: parseFloat(station.price_per_kwh || 0),
    // Parse arrays
    connector_types: connectorTypes,
    amenities: amenities,
    // Transform charging_points if present
    charging_points: station.charging_points?.map(point => ({
      ...point,
      max_power_kw: parseFloat(point.max_power_kw || 0),
      price_per_kwh: parseFloat(point.price_per_kwh || 0),
      price_per_hour: point.price_per_hour ? parseFloat(point.price_per_hour) : null,
    })) || [],
  };
};

const stationService = {
  // Search stations with optional filters
  searchStations: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, { params });
    // Transform array of stations
    const stations = Array.isArray(response.data) ? response.data : [];
    return stations.map(transformStationData);
  },

  // Get station by ID
  getStationById: async (stationId) => {
    const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
    const response = await apiClient.get(url);
    return transformStationData(response.data);
  },

  // Get nearby stations based on coordinates
  getNearby: async (latitude, longitude, radius = 10) => {
    const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, {
      params: { lat: latitude, lng: longitude, radius }
    });
    const stations = Array.isArray(response.data) ? response.data : [];
    return stations.map(transformStationData);
  },

  // Get station availability
  getAvailability: async (stationId) => {
    const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
    const response = await apiClient.get(url);
    // Extract availability info from station data
    const station = transformStationData(response.data);
    return {
      station_id: stationId,
      available_ports: station.available_ports || 0,
      total_ports: station.total_ports || 0,
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
