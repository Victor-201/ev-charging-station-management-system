// src/services/stationService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const stationService = {
  // Get all stations with optional filters
  getAll: (params) => apiClient.get('/stations', { params }),
  
  // Get station by ID
  getById: (stationId) => apiClient.get(`/stations/${stationId}`),
  
  // Get nearby stations based on coordinates
  getNearby: (latitude, longitude, radius = 10) => 
    apiClient.get('/stations/nearby', { 
      params: { latitude, longitude, radius } 
    }),
  
  // Get station availability
  getAvailability: (stationId) => 
    apiClient.get(`/stations/${stationId}/availability`),
  
  // Get station connectors
  getConnectors: (stationId) => 
    apiClient.get(`/stations/${stationId}/connectors`),
  
  // Report station issue
  reportIssue: (stationId, payload) => 
    apiClient.post(`/stations/${stationId}/report-issue`, payload),
  
  // Get station pricing
  getPricing: (stationId) => 
    apiClient.get(`/stations/${stationId}/pricing`),
};

export default stationService;
