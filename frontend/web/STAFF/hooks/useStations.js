// src/hooks/useStations.js
import { useCallback, useEffect, useState } from 'react';
import * as stationsApi from '../api/stations.api';

/**
 * useStations
 * - stations, loading, error
 * - refetch, getStation, getConnectors, reportIssue, setMaintenance, getPricing, checkAvailability
 */

export const useStations = (initialParams = {}) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchStations = useCallback(async (p = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationsApi.getStations(p);
      // expecting res.data or res
      const data = res?.data ?? res;
      setStations(data?.items ?? data); // flexible shape
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchStations().catch(() => {});
  }, [fetchStations]);

  const refetch = async (p = params) => {
    return fetchStations(p);
  };

  const getStation = async (stationId) => {
    try {
      const res = await stationsApi.getStationById(stationId);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const getConnectors = async (stationId) => {
    try {
      const res = await stationsApi.getConnectors(stationId);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const reportIssue = async (stationId, payload) => {
    try {
      const res = await stationsApi.reportIssue(stationId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const setMaintenance = async (stationId, payload) => {
    try {
      const res = await stationsApi.setMaintenance(stationId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const getPricing = async (stationId) => {
    try {
      const res = await stationsApi.getPricing(stationId);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  const checkAvailability = async (p = {}) => {
    try {
      const res = await stationsApi.checkAvailability(p);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  };

  return {
    stations,
    loading,
    error,
    params,
    setParams,
    refetch,
    getStation,
    getConnectors,
    reportIssue,
    setMaintenance,
    getPricing,
    checkAvailability,
  };
};
