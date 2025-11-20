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

  const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const safeParseInt = (value) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  const parseStringArray = (arr) => {
    if (!arr) return [];
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') {
      try {
        const parsed = JSON.parse(arr);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return arr.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Backend returns charging_points array, calculate totals from it
  const chargingPoints = station.charging_points || [];
  const totalPorts = chargingPoints.length;
  const availablePorts = chargingPoints.filter(cp => cp.status === 'available').length;
  
  // Extract unique connector types from charging_points
  const connectorTypes = [...new Set(
    chargingPoints
      .map(cp => cp.connector_type)
      .filter(Boolean)
  )];

  return {
    ...station,
    // Fix text encoding (backend database issue)
    name: fixTextEncoding(station.name),
    address: fixTextEncoding(station.address),
    city: fixTextEncoding(station.city),
    region: fixTextEncoding(station.region),
    // Safely parse coordinates to numbers
    latitude: safeParseFloat(station.latitude),
    longitude: safeParseFloat(station.longitude),
    // Calculate from charging_points
    total_ports: totalPorts,
    available_ports: availablePorts,
    // Safely parse numeric fields
    rating: safeParseFloat(station.rating),
    price_per_kwh: safeParseFloat(station.price_per_kwh),
    // Extract from charging_points or use existing
    connector_types: connectorTypes.length > 0 ? connectorTypes : parseStringArray(station.connector_types),
    amenities: parseStringArray(station.amenities),
    // Transform charging_points if present
    charging_points: chargingPoints.map(point => ({
      ...point,
      max_power_kw: safeParseFloat(point.max_power_kw),
      price_per_kwh: safeParseFloat(point.price_per_kwh),
      price_per_hour: point.price_per_hour ? safeParseFloat(point.price_per_hour) : null,
    })),
  };
};

const stationService = {
  // Search stations with optional filters
  searchStations: async (params = {}) => {
    try {
      // Map mobile params to backend required params
      const backendParams = {};
      
      // Backend requires: latitude, longitude, radius (all required)
      if (params.lat !== undefined && params.lat !== null) {
        backendParams.latitude = String(params.lat);
      }
      if (params.lng !== undefined && params.lng !== null) {
        backendParams.longitude = String(params.lng);
      }
      if (params.radius !== undefined && params.radius !== null) {
        backendParams.radius = String(params.radius);
      }
      
      // Optional params
      if (params.connector_type) backendParams.connector_type = params.connector_type;
      if (params.power_min) backendParams.power_min = String(params.power_min);
      if (params.status) backendParams.status = params.status;
      if (params.page) backendParams.page = String(params.page);
      if (params.size) backendParams.size = String(params.size);
      
      // Validate required params
      if (!backendParams.latitude || !backendParams.longitude || !backendParams.radius) {
        console.warn('Missing required search params (latitude, longitude, radius)');
        return [];
      }
      
      const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, { params: backendParams });
      // Handle different response formats
      const data = response.data?.data || response.data;
      const stations = Array.isArray(data) ? data : [];
      return stations.map(transformStationData);
    } catch (error) {
      console.error('Error searching stations:', error.response?.data || error.message);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  // Get station by ID
  getStationById: async (stationId) => {
    try {
      const url = ENDPOINTS.STATION.DETAIL.replace(':id', stationId);
      const response = await apiClient.get(url);
      const station = response.data;
      
      // Backend getStationById returns minimal data, fetch connectors separately
      try {
        const connectorsUrl = ENDPOINTS.STATION.CONNECTORS.replace(':id', stationId);
        const connectorsResponse = await apiClient.get(connectorsUrl);
        const connectors = connectorsResponse.data || [];
        
        // Transform connectors to charging_points format
        station.charging_points = connectors.map(c => ({
          id: c.point_id,
          connector_type: c.type,
          max_power_kw: c.max_power_kw,
          status: c.status,
        }));
      } catch (err) {
        console.warn('Failed to fetch connectors:', err);
        station.charging_points = [];
      }
      
      return transformStationData(station);
    } catch (error) {
      console.error('Error fetching station by ID:', error);
      throw error;
    }
  },

  // Get nearby stations based on coordinates
  getNearby: async (latitude, longitude, radius = 10) => {
    try {
      const backendParams = {
        latitude: String(latitude),
        longitude: String(longitude),
        radius: String(radius),
      };
      
      const response = await apiClient.get(ENDPOINTS.STATION.SEARCH, { params: backendParams });
      const data = response.data?.data || response.data;
      const stations = Array.isArray(data) ? data : [];
      return stations.map(transformStationData);
    } catch (error) {
      console.error('Error fetching nearby stations:', error.response?.data || error.message);
      return [];
    }
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
