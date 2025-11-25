// services/analytics.service.js
import { query } from "../config/database.js";

/* =======================================================
   MONITORING
======================================================= */
export const getMonitoringServicesQuery = async () => {
  return await query(
    `SELECT service_id, service_name, status, updated_at
     FROM monitoring_services
     ORDER BY updated_at DESC`
  );
};

export const getMonitoringMetricsQuery = async () => {
  return await query(
    `SELECT metric_id, metric, bucket, bucket_interval, avg_value
     FROM monitoring_metrics
     ORDER BY bucket DESC`
  );
};

export const getMonitoringLogsQuery = async (size = 100) => {
  const limit = Number.isFinite(Number(size))
    ? Math.max(1, Math.min(Number(size), 500))
    : 100;

  return await query(
    `SELECT log_id, service_name, level, message, created_at
     FROM monitoring_logs
     ORDER BY created_at DESC
     LIMIT ${limit}`
  );
};

export const getMonitoringAlertsQuery = async () => {
  return await query(
    `SELECT alert_id, type, status, description,
            triggered_at, acknowledged_at, acknowledged_by
     FROM monitoring_alerts
     ORDER BY triggered_at DESC`
  );
};

export const ackMonitoringAlertQuery = async (alertId) => {
  return await query(
    `UPDATE monitoring_alerts
     SET status='acknowledged',
         acknowledged_at=NOW()
     WHERE alert_id = ?`,
    [alertId]
  );
};

/* =======================================================
   ANALYTICS - LIST MODE REPORTS
======================================================= */
export const getUsersMonthlyListQuery = async ({ month }) => {
  return await query(
    `SELECT user_id, billing_month AS month, total_cost, total_sessions
     FROM user_monthly_reports
     WHERE billing_month = ?
     ORDER BY total_cost DESC`,
    [month]
  );
};

export const getStationsMonthlyListQuery = async ({ month }) => {
  return await query(
    `SELECT station_id, report_date AS date, revenue, sessions, total_kwh
     FROM station_daily_reports
     WHERE DATE_FORMAT(report_date, '%Y-%m') = ?
     ORDER BY report_date DESC`,
    [month]
  );
};

/* =======================================================
   REVENUE SUMMARY (optional)
======================================================= */
export const getRevenueReportQuery = async ({ stationId, from, to }) => {
  const params = [from, to];
  let sql =
    `SELECT SUM(revenue) AS total_revenue
     FROM station_daily_reports
     WHERE report_date BETWEEN ? AND ?`;

  if (stationId) {
    sql += ` AND station_id = ?`;
    params.push(stationId);
  }

  const rows = await query(sql, params);
  return { total_revenue: Number(rows[0]?.total_revenue || 0) };
};

/* =======================================================
   FORECAST
======================================================= */
export const startForecastJobQuery = async ({ model, stations, from, to }) => {
  await query(
    `INSERT INTO forecast_jobs (job_id, model_name, station_ids, range_start, range_end, status)
     VALUES (UUID(), ?, ?, ?, ?, 'started')`,
    [model || "default", JSON.stringify(stations || []), from, to]
  );
  return { status: "started" };
};

export const getStationForecastQuery = async ({ stationId, horizonDays }) => {
  const rows = await query(
    `SELECT forecast_date AS date, expected_kwh
     FROM station_forecasts
     WHERE station_id = ?
     ORDER BY forecast_date ASC
     LIMIT ?`,
    [stationId, Number(horizonDays)]
  );

  return {
    station_id: stationId,
    forecast: rows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date,
      expected_kwh: Number(r.expected_kwh || 0),
    })),
  };
};
