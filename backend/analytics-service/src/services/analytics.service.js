import { query } from '../config/database.js';

export const getUserMonthlyReport = async ({ userId, month }) => {
  const [report] = await query(
    `SELECT billing_month AS month,
            total_cost,
            total_sessions AS sessions
     FROM user_monthly_reports
     WHERE user_id = ? AND billing_month = ?
     LIMIT 1`,
    [userId, month]
  );

  if (!report) {
    return null;
  }

  return {
    month: report.month,
    total_cost: Number(report.total_cost),
    sessions: Number(report.sessions)
  };
};

export const getStationDailyReport = async ({ stationId, date }) => {
  const [report] = await query(
    `SELECT report_date AS date,
            total_kwh,
            sessions,
            revenue
     FROM station_daily_reports
     WHERE station_id = ? AND report_date = ?
     LIMIT 1`,
    [stationId, date]
  );

  if (!report) {
    return null;
  }

  return {
    date: report.date instanceof Date ? report.date.toISOString().slice(0, 10) : report.date,
    total_kwh: Number(report.total_kwh),
    sessions: Number(report.sessions),
    revenue: Number(report.revenue)
  };
};

export const getRevenueReport = async ({ stationId, from, to, groupBy }) => {
  const params = [from, to];
  let queryText =
    `SELECT SUM(revenue) AS total_revenue
     FROM station_daily_reports
     WHERE report_date BETWEEN ? AND ?`;

  if (stationId) {
    queryText += ' AND station_id = ?';
    params.push(stationId);
  }

  const [summary] = await query(queryText, params);

  return {
    total_revenue: Number(summary?.total_revenue ?? 0)
  };
};

export const startForecastTraining = async ({ model, stations, from, to }) => {
  const insertResult = await query(
    `INSERT INTO forecast_jobs (model_name, station_ids, range_start, range_end, status)
     VALUES (?, ?, ?, ?, 'started')`,
    [model, JSON.stringify(stations), from, to]
  );

  const jobId = `ML_${String(insertResult.insertId || 1).padStart(3, '0')}`;

  return {
    job_id: jobId,
    status: 'started'
  };
};

export const getStationForecast = async ({ stationId, horizonDays }) => {
  const limit = Number.isFinite(Number(horizonDays)) && Number(horizonDays) > 0
    ? Number(horizonDays)
    : 7;

  const rows = await query(
    `SELECT forecast_date AS date, expected_kwh
     FROM station_forecasts
     WHERE station_id = ?
     ORDER BY forecast_date ASC
     LIMIT ${limit}`,
    [stationId]
  );

  return {
    station_id: stationId,
    forecast: rows.map((row) => ({
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
      expected_kwh: Number(row.expected_kwh)
    }))
  };
};
