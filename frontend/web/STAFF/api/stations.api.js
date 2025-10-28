// src/api/stations.api.js
import client from './client';

/**
 * Stations endpoints (theo danh sách của bạn)
 * GET  /api/v1/stations
 * POST /api/v1/stations        (admin)
 * GET  /api/v1/stations/{station_id}
 * PUT  /api/v1/stations/{station_id}
 * DELETE /api/v1/stations/{station_id}
 * GET  /api/v1/stations/{station_id}/connectors
 * POST /api/v1/stations/{station_id}/report-issue
 * POST /api/v1/stations/{station_id}/maintenance
 * GET  /api/v1/stations/{station_id}/pricing
 * GET  /api/v1/availability
 */

export const getStations = async (params = {}) => {
  const res = await client.get('/stations', { params });
  return res.data;
};

export const createStation = async (payload) => {
  const res = await client.post('/stations', payload);
  return res.data;
};

export const getStationById = async (stationId) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.get(`/stations/${stationId}`);
  return res.data;
};

export const updateStation = async (stationId, payload) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.put(`/stations/${stationId}`, payload);
  return res.data;
};

export const deleteStation = async (stationId) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.delete(`/stations/${stationId}`);
  return res.data;
};

export const getConnectors = async (stationId) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.get(`/stations/${stationId}/connectors`);
  return res.data;
};

export const reportIssue = async (stationId, payload) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.post(`/stations/${stationId}/report-issue`, payload);
  return res.data;
};

export const setMaintenance = async (stationId, payload) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.post(`/stations/${stationId}/maintenance`, payload);
  return res.data;
};

export const getPricing = async (stationId) => {
  if (!stationId) throw new Error('stationId required');
  const res = await client.get(`/stations/${stationId}/pricing`);
  return res.data;
};

export const checkAvailability = async (params = {}) => {
  // GET /api/v1/availability
  const res = await client.get('/availability', { params });
  return res.data;
};
