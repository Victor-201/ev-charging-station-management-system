// controllers/analytics.controller.js
import {
  getMonitoringServicesQuery,
  getMonitoringMetricsQuery,
  getMonitoringLogsQuery,
  getMonitoringAlertsQuery,
  ackMonitoringAlertQuery,

  getUsersMonthlyListQuery,
  getStationsMonthlyListQuery,
  getRevenueReportQuery,

  startForecastJobQuery,
  getStationForecastQuery,
} from "../services/analytics.service.js";

/* =======================================================
   MONITORING
======================================================= */
export const getMonitoringHealth = async (_req, res) => {
  try {
    const rows = await getMonitoringServicesQuery();
    return res.json({
      services: rows.map((x) => ({
        service_id: x.service_id,
        service_name: x.service_name,
        status: x.status,
        updated_at: x.updated_at,
      })),
    });
  } catch (e) {
    console.error("getMonitoringHealth error:", e);
    return res.status(500).json({ message: "Error loading health" });
  }
};

export const getMonitoringMetrics = async (_req, res) => {
  try {
    const rows = await getMonitoringMetricsQuery();
    return res.json({
      metrics: rows.map((x) => ({
        metric_id: x.metric_id,
        metric: x.metric,
        bucket: x.bucket,
        bucket_interval: x.bucket_interval,
        avg_value: Number(x.avg_value || 0),
      })),
    });
  } catch (e) {
    console.error("getMonitoringMetrics error:", e);
    return res.status(500).json({ message: "Error loading metrics" });
  }
};

export const getMonitoringLogs = async (req, res) => {
  const size = Number(req.query.size || 50);
  try {
    const logs = await getMonitoringLogsQuery(size);
    return res.json({
      logs: logs.map((x) => ({
        log_id: x.log_id,
        service_name: x.service_name,
        level: x.level,
        message: x.message,
        created_at: x.created_at,
      })),
    });
  } catch (e) {
    console.error("getMonitoringLogs error:", e);
    return res.status(500).json({ message: "Error loading logs" });
  }
};

export const getMonitoringAlerts = async (_req, res) => {
  try {
    const alerts = await getMonitoringAlertsQuery();
    return res.json({
      alerts: alerts.map((x) => ({
        alert_id: x.alert_id,
        type: x.type,
        status: x.status,
        description: x.description,
        triggered_at: x.triggered_at,
        acknowledged_at: x.acknowledged_at,
        acknowledged_by: x.acknowledged_by,
      })),
    });
  } catch (e) {
    console.error("getMonitoringAlerts error:", e);
    return res.status(500).json({ message: "Error loading alerts" });
  }
};

export const acknowledgeAlert = async (req, res) => {
  const { alert_id } = req.body;
  if (!alert_id) return res.status(400).json({ message: "Missing alert_id" });

  try {
    await ackMonitoringAlertQuery(alert_id);
    return res.json({ success: true });
  } catch (e) {
    console.error("acknowledgeAlert error:", e);
    return res.status(500).json({ message: "ACK failed" });
  }
};

/* =======================================================
   ANALYTICS - LIST MODE REPORTS
======================================================= */
export const usersMonthlyList = async (req, res) => {
  const month = req.query.month;
  if (!month) return res.status(400).json({ message: "Missing month=YYYY-MM" });

  try {
    const rows = await getUsersMonthlyListQuery({ month });
    return res.json({
      data: rows.map((r) => ({
        user_id: r.user_id,
        month: r.month,
        total_cost: Number(r.total_cost || 0),
        total_sessions: Number(r.total_sessions || 0),
      })),
    });
  } catch (e) {
    console.error("usersMonthlyList error:", e);
    return res.status(500).json({ message: "Error loading users monthly list" });
  }
};

export const stationsMonthlyList = async (req, res) => {
  const month = req.query.month;
  if (!month) return res.status(400).json({ message: "Missing month=YYYY-MM" });

  try {
    const rows = await getStationsMonthlyListQuery({ month });
    return res.json({
      data: rows.map((r) => ({
        station_id: r.station_id,
        date: r.date,
        revenue: Number(r.revenue || 0),
        sessions: Number(r.sessions || 0),
        total_kwh: Number(r.total_kwh || 0),
      })),
    });
  } catch (e) {
    console.error("stationsMonthlyList error:", e);
    return res.status(500).json({ message: "Error loading stations monthly list" });
  }
};

/* =======================================================
   REVENUE SUMMARY (optional)
======================================================= */
export const revenueReport = async (req, res) => {
  const { stationId, from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "Missing from=YYYY-MM-DD&to=YYYY-MM-DD" });
  }

  try {
    const summary = await getRevenueReportQuery({ stationId, from, to });
    return res.json({
      summary: {
        stationId: stationId || null,
        total_revenue: summary.total_revenue,
      },
    });
  } catch (e) {
    console.error("revenueReport error:", e);
    return res.status(500).json({ message: "Error loading revenue" });
  }
};

/* =======================================================
   FORECAST (giữ backend)
======================================================= */
export const forecastTrain = async (req, res) => {
  const { model, stations, from, to } = req.body;
  try {
    const job = await startForecastJobQuery({ model, stations, from, to });
    return res.json(job);
  } catch (e) {
    console.error("forecastTrain error:", e);
    return res.status(500).json({ message: "Forecast train error" });
  }
};

export const stationForecast = async (req, res) => {
  const stationId = req.params.station_id;
  const horizonDays = req.query.horizonDays || 7;

  try {
    const result = await getStationForecastQuery({ stationId, horizonDays });
    return res.json({
      station_id: stationId,
      forecast: result.forecast,
    });
  } catch (e) {
    console.error("stationForecast error:", e);
    return res.status(500).json({ message: "Forecast error" });
  }
};
