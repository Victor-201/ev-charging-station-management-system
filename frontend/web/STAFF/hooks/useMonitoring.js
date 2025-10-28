// src/hooks/useMonitoring.js
import { useCallback, useState } from 'react';
import * as monitoringApi from '../api/monitoring.api';

/**
 * useMonitoring
 * - getHealth, getMetrics, searchLogs, getAlerts, ackAlert, getActiveSessions, getStationRealtimeData
 */

export const useMonitoring = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getHealth();
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getMetrics(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.searchLogs(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlerts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getAlerts(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const ackAlert = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.ackAlert(payload);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveSessions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getActiveSessions(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStationRealtimeData = useCallback(async (stationId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getStationRealtimeData(stationId, params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getHealth,
    getMetrics,
    searchLogs,
    getAlerts,
    ackAlert,
    getActiveSessions,
    getStationRealtimeData,
  };
};
