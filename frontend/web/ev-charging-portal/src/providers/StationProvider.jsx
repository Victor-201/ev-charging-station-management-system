import React, { useState, useCallback, useMemo } from "react";
import { StationContext } from "@/contexts/StationContext";
import stationService from "@/services/stationService"; // or "@/api/stationService"

export const StationProvider = ({ children }) => {
  // common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // cached data
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [pricing, setPricing] = useState(null);

  // ===== STATION =====
  const getAll = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getAll(params);
      const data = res?.data ?? res;
      setStations(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.create(payload);
      const data = res?.data ?? res;
      // optional: append to stations cache
      setStations(prev => (prev ? [data, ...prev] : [data]));
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const getById = useCallback(async (station_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getById(station_id);
      const data = res?.data ?? res;
      setCurrentStation(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const update = useCallback(async (station_id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.update(station_id, payload);
      const data = res?.data ?? res;
      // update cache if present
      setStations(prev => prev?.map(s => (s.id === data.id || s.station_id === data.station_id ? data : s)) ?? prev);
      setCurrentStation(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const remove = useCallback(async (station_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.remove(station_id);
      setStations(prev => prev?.filter(s => s.id !== station_id && s.station_id !== station_id) ?? prev);
      // if currentStation is removed, clear it
      setCurrentStation(prev => (prev && (prev.id === station_id || prev.station_id === station_id) ? null : prev));
      setLoading(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const getConnectors = useCallback(async (station_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getConnectors(station_id);
      const data = res?.data ?? res;
      setConnectors(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const reportIssue = useCallback(async (station_id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.reportIssue(station_id, payload);
      setLoading(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);
  const fetchReportIssues = useCallback(async (stationId, params = {}) => {
    if (!stationId) throw new Error("stationId is required");
    _setStateFor(stationId, { loading: true, error: null });

    try {
      const res = await stationService.getReportIssues(stationId, params);
      // giả sử API trả về array ở res.data
      _setStateFor(stationId, { data: res?.data || [], loading: false, error: null });
      return res?.data || [];
    } catch (err) {
      _setStateFor(stationId, { loading: false, error: err });
      throw err;
    }
  }, []);

  const setMaintenance = useCallback(async (station_id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.setMaintenance(station_id, payload);
      setLoading(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== CHARGER =====
  const registerCharger = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.registerCharger(payload);
      const data = res?.data ?? res;
      setChargers(prev => (prev ? [data, ...prev] : [data]));
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const getChargerById = useCallback(async (charger_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getChargerById(charger_id);
      const data = res?.data ?? res;
      // optionally update chargers cache
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const getChargerHealth = useCallback(async (charger_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getChargerHealth(charger_id);
      const data = res?.data ?? res;
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const updateFirmware = useCallback(async (charger_id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.updateFirmware(charger_id, payload);
      setLoading(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const controlCharger = useCallback(async (charger_id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.controlCharger(charger_id, payload);
      setLoading(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== AVAILABILITY =====
  const getAvailability = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getAvailability(params);
      const data = res?.data ?? res;
      setAvailability(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== PRICING =====
  const getStationPricing = useCallback(async (station_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getStationPricing(station_id);
      const data = res?.data ?? res;
      setPricing(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  const getChargerPricing = useCallback(async (charger_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stationService.getChargerPricing(charger_id);
      const data = res?.data ?? res;
      setPricing(data);
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      // states
      loading,
      error,
      stations,
      currentStation,
      connectors,
      chargers,
      availability,
      pricing,

      // station actions
      getAll,
      create,
      getById,
      update,
      remove,
      getConnectors,
      reportIssue,
      setMaintenance,
      fetchReportIssues,

      // charger actions
      registerCharger,
      getChargerById,
      getChargerHealth,
      updateFirmware,
      controlCharger,

      // availability & pricing
      getAvailability,
      getStationPricing,
      getChargerPricing,

      // setters (optional) in case some component wants to manually set cache
      setStations,
      setCurrentStation,
      setConnectors,
      setChargers,
      setAvailability,
      setPricing,
    }),
    [
      loading,
      error,
      stations,
      currentStation,
      connectors,
      chargers,
      availability,
      pricing,
      getAll,
      create,
      getById,
      update,
      remove,
      getConnectors,
      reportIssue,
      setMaintenance,
      registerCharger,
      getChargerById,
      getChargerHealth,
      updateFirmware,
      controlCharger,
      getAvailability,
      getStationPricing,
      getChargerPricing,
    ]
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
};
