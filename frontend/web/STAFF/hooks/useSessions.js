// src/hooks/useSessions.js
import { useCallback, useEffect, useState } from 'react';
import * as sessionsApi from '../api/sessions.api';

/**
 * useSessions
 * - Manage sessions actions & simple local list (optional)
 * - create/initiateSession, start, pause, resume, stop, getSessionById, getSessionEvents, pushMeterReading, getTelemetry
 */

export const useSessions = (opts = {}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.getSessions(params);
      const data = res?.data ?? res;
      setSessions(data?.items ?? data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opts.autoFetch) {
      fetchSessions().catch(() => {});
    }
  }, [fetchSessions, opts.autoFetch]);

  const initiateSession = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.initiateSession(payload);
      // optionally refresh list
      try { await fetchSessions(); } catch(_) {}
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.startSession(payload);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const pauseSession = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.pauseSession(sessionId);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.resumeSession(sessionId);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.stopSession(sessionId);
      // optionally refresh list
      try { await fetchSessions(); } catch(_) {}
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSessionById = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionsApi.getSessionById(sessionId);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSessionEvents = async (sessionId, params = {}) => {
    try {
      const res = await sessionsApi.getSessionEvents(sessionId, params);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const pushMeterReading = async (sessionId, meterPayload) => {
    try {
      const res = await sessionsApi.pushMeterReading(sessionId, meterPayload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const getSessionTelemetry = async (sessionId, params = {}) => {
    try {
      const res = await sessionsApi.getSessionTelemetry(sessionId, params);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    initiateSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    getSessionById,
    getSessionEvents,
    pushMeterReading,
    getSessionTelemetry,
  };
};
