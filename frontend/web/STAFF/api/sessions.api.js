// src/api/sessions.api.js
import client from './client';

/**
 * Session endpoints (đúng theo list)
 * POST /api/v1/sessions/initiate
 * POST /api/v1/sessions/start
 * POST /api/v1/sessions/{session_id}/meter
 * GET  /api/v1/sessions/{session_id}/telemetry
 * POST /api/v1/sessions/{session_id}/pause
 * POST /api/v1/sessions/{session_id}/resume
 * POST /api/v1/sessions/{session_id}/stop
 * GET  /api/v1/sessions/{session_id}
 * GET  /api/v1/sessions/{session_id}/events
 */

export const initiateSession = async (payload) => {
  const res = await client.post('/sessions/initiate', payload);
  return res.data;
};

export const startSession = async (payload) => {
  const res = await client.post('/sessions/start', payload);
  return res.data;
};

export const pushMeterReading = async (sessionId, meterPayload) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.post(`/sessions/${sessionId}/meter`, meterPayload);
  return res.data;
};

export const getSessionTelemetry = async (sessionId, params = {}) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.get(`/sessions/${sessionId}/telemetry`, { params });
  return res.data;
};

export const pauseSession = async (sessionId) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.post(`/sessions/${sessionId}/pause`);
  return res.data;
};

export const resumeSession = async (sessionId) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.post(`/sessions/${sessionId}/resume`);
  return res.data;
};

export const stopSession = async (sessionId) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.post(`/sessions/${sessionId}/stop`);
  return res.data;
};

export const getSessionById = async (sessionId) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.get(`/sessions/${sessionId}`);
  return res.data;
};

export const getSessionEvents = async (sessionId, params = {}) => {
  if (!sessionId) throw new Error('sessionId required');
  const res = await client.get(`/sessions/${sessionId}/events`, { params });
  return res.data;
};
