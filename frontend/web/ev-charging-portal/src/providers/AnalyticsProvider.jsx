// contexts/AnalyticsProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { AnalyticsContext } from "@/contexts/AnalyticsContext";
import analyticsService from "@/services/analyticsService"; // sửa path nếu cần

export const AnalyticsProvider = ({ children }) => {
  // global error
  const [error, setError] = useState(null);

  // loading flags grouped by domain
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // caches / last results
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userMonthlyReport, setUserMonthlyReport] = useState(null);
  const [stationDailyReport, setStationDailyReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [forecastModelStatus, setForecastModelStatus] = useState(null);
  const [forecastByStation, setForecastByStation] = useState(null);
  const [rawTelemetry, setRawTelemetry] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [overview, setOverview] = useState(null);
  const [stationStats, setStationStats] = useState(null);
  const [revenue, setRevenue] = useState(null);

  // ===== MONITORING =====
  const getHealth = useCallback(async () => {
    setLoadingMonitoring(true);
    setError(null);
    try {
      const res = await analyticsService.getHealth();
      const data = res?.data ?? res;
      setHealth(data);
      setLoadingMonitoring(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingMonitoring(false);
      return { success: false, error: err };
    }
  }, []);

  const getMetrics = useCallback(async () => {
    setLoadingMonitoring(true);
    setError(null);
    try {
      const res = await analyticsService.getMetrics();
      const data = res?.data ?? res;
      setMetrics(data);
      setLoadingMonitoring(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingMonitoring(false);
      return { success: false, error: err };
    }
  }, []);

  const getLogs = useCallback(async (params) => {
    setLoadingMonitoring(true);
    setError(null);
    try {
      const res = await analyticsService.getLogs(params);
      const data = res?.data ?? res;
      setLogs(data);
      setLoadingMonitoring(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingMonitoring(false);
      return { success: false, error: err };
    }
  }, []);

  const getAlerts = useCallback(async () => {
    setLoadingMonitoring(true);
    setError(null);
    try {
      const res = await analyticsService.getAlerts();
      const data = res?.data ?? res;
      setAlerts(data);
      setLoadingMonitoring(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingMonitoring(false);
      return { success: false, error: err };
    }
  }, []);

  const ackAlert = useCallback(async (payload) => {
    setLoadingMonitoring(true);
    setError(null);
    try {
      const res = await analyticsService.ackAlert(payload);
      const data = res?.data ?? res;
      // optionally update alerts cache (mark acked)
      setAlerts(prev => prev?.map(a => (a.id === payload?.id ? { ...a, acknowledged: true } : a)) ?? prev);
      setLoadingMonitoring(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingMonitoring(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== ANALYTICS / REPORTS =====
  const getUserMonthlyReport = useCallback(async (user_id) => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await analyticsService.getUserMonthlyReport(user_id);
      const data = res?.data ?? res;
      setUserMonthlyReport(data);
      setLoadingAnalytics(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingAnalytics(false);
      return { success: false, error: err };
    }
  }, []);

  const getStationDailyReport = useCallback(async (station_id) => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await analyticsService.getStationDailyReport(station_id);
      const data = res?.data ?? res;
      setStationDailyReport(data);
      setLoadingAnalytics(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingAnalytics(false);
      return { success: false, error: err };
    }
  }, []);

  const getRevenueReport = useCallback(async (params) => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await analyticsService.getRevenueReport(params);
      const data = res?.data ?? res;
      setRevenueReport(data);
      setLoadingAnalytics(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingAnalytics(false);
      return { success: false, error: err };
    }
  }, []);

  const trainForecastModel = useCallback(async (payload) => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await analyticsService.trainForecastModel(payload);
      const data = res?.data ?? res;
      setForecastModelStatus(data);
      setLoadingAnalytics(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingAnalytics(false);
      return { success: false, error: err };
    }
  }, []);

  const getForecastByStation = useCallback(async (station_id) => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await analyticsService.getForecastByStation(station_id);
      const data = res?.data ?? res;
      setForecastByStation(data);
      setLoadingAnalytics(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingAnalytics(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== TELEMETRY =====
  const getRawTelemetry = useCallback(async (params) => {
    setLoadingTelemetry(true);
    setError(null);
    try {
      const res = await analyticsService.getRawTelemetry(params);
      const data = res?.data ?? res;
      setRawTelemetry(data);
      setLoadingTelemetry(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingTelemetry(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== DASHBOARD =====
  const getDashboards = useCallback(async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const res = await analyticsService.getDashboards();
      const data = res?.data ?? res;
      setDashboards(data);
      setLoadingDashboard(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingDashboard(false);
      return { success: false, error: err };
    }
  }, []);

  const createDashboard = useCallback(async (payload) => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const res = await analyticsService.createDashboard(payload);
      const data = res?.data ?? res;
      setDashboards(prev => (prev ? [data, ...prev] : [data]));
      setLoadingDashboard(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingDashboard(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== EXISTING / OVERVIEW =====
  const getOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);
    try {
      const res = await analyticsService.getOverview();
      const data = res?.data ?? res;
      setOverview(data);
      setLoadingOverview(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingOverview(false);
      return { success: false, error: err };
    }
  }, []);

  const getStationStats = useCallback(async (id) => {
    setLoadingOverview(true);
    setError(null);
    try {
      const res = await analyticsService.getStationStats(id);
      const data = res?.data ?? res;
      setStationStats(data);
      setLoadingOverview(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingOverview(false);
      return { success: false, error: err };
    }
  }, []);

  const getRevenue = useCallback(async (params) => {
    setLoadingOverview(true);
    setError(null);
    try {
      const res = await analyticsService.getRevenue(params);
      const data = res?.data ?? res;
      setRevenue(data);
      setLoadingOverview(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingOverview(false);
      return { success: false, error: err };
    }
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      // errors & flags
      error,
      loadingMonitoring,
      loadingAnalytics,
      loadingTelemetry,
      loadingDashboard,
      loadingOverview,

      // caches
      health,
      metrics,
      logs,
      alerts,
      userMonthlyReport,
      stationDailyReport,
      revenueReport,
      forecastModelStatus,
      forecastByStation,
      rawTelemetry,
      dashboards,
      overview,
      stationStats,
      revenue,

      // monitoring
      getHealth,
      getMetrics,
      getLogs,
      getAlerts,
      ackAlert,

      // analytics / reports
      getUserMonthlyReport,
      getStationDailyReport,
      getRevenueReport,
      trainForecastModel,
      getForecastByStation,

      // telemetry
      getRawTelemetry,

      // dashboard
      getDashboards,
      createDashboard,

      // overview / existing
      getOverview,
      getStationStats,
      getRevenue,

      // optional setters
      setHealth,
      setMetrics,
      setLogs,
      setAlerts,
      setUserMonthlyReport,
      setStationDailyReport,
      setRevenueReport,
      setForecastModelStatus,
      setForecastByStation,
      setRawTelemetry,
      setDashboards,
      setOverview,
      setStationStats,
      setRevenue,
    }),
    [
      error,
      loadingMonitoring,
      loadingAnalytics,
      loadingTelemetry,
      loadingDashboard,
      loadingOverview,
      health,
      metrics,
      logs,
      alerts,
      userMonthlyReport,
      stationDailyReport,
      revenueReport,
      forecastModelStatus,
      forecastByStation,
      rawTelemetry,
      dashboards,
      overview,
      stationStats,
      revenue,
      // callbacks stable via useCallback; included for completeness
      getHealth,
      getMetrics,
      getLogs,
      getAlerts,
      ackAlert,
      getUserMonthlyReport,
      getStationDailyReport,
      getRevenueReport,
      trainForecastModel,
      getForecastByStation,
      getRawTelemetry,
      getDashboards,
      createDashboard,
      getOverview,
      getStationStats,
      getRevenue,
    ]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};
