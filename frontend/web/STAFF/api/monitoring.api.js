// src/api/monitoring.api.js
import client from './client';

/**
 * Monitoring endpoints:
 * GET  /api/v1/monitoring/health
 * GET  /api/v1/monitoring/metrics
 * GET  /api/v1/monitoring/logs
 * GET  /api/v1/monitoring/alerts
 * POST /api/v1/monitoring/alerts/ack
 */

export const getHealth = async () => {
  const res = await client.get('/monitoring/health');
  return res.data;
};

export const getMetrics = async (params = {}) => {
  const res = await client.get('/monitoring/metrics', { params });
  return res.data;
};

export const searchLogs = async (params = {}) => {
  const res = await client.get('/monitoring/logs', { params });
  return res.data;
};

export const getAlerts = async (params = {}) => {
  const res = await client.get('/monitoring/alerts', { params });
  return res.data;
};

export const ackAlert = async (payload) => {
  // payload: { alertId: '...', acknowledged_by: 'staffId' }
  const res = await client.post('/monitoring/alerts/ack', payload);
  return res.data;
};
