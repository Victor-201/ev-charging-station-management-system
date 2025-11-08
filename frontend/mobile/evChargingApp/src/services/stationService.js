// src/services/stationService.js
import mockService from './mockService';

const stationService = {
  // Get all stations with optional filters
  getAll: (params) => mockService.getStations(),

  // Get station by ID
  getById: (stationId) => mockService.getStationById(stationId),

  // Get nearby stations based on coordinates
  getNearby: (latitude, longitude, radius = 10) => mockService.getStations(), // For now, return all

  // Get station availability
  getAvailability: (stationId) => mockService.mockApi({ station_id: stationId, available_ports: 3, total_ports: 4 }),

  // Get station connectors
  getConnectors: (stationId) => mockService.mockApi(['Type 2', 'CCS2']),

  // Report station issue
  reportIssue: (stationId, payload) => mockService.mockApi({ message: 'Issue reported successfully' }),

  // Get station pricing
  getPricing: (stationId) => mockService.mockApi({ station_id: stationId, price_per_kwh: 2000 }),
};

export default stationService;
