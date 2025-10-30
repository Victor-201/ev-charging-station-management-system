import { query } from '../config/database.js';

// ===== 1️⃣ Thống kê hệ thống =====
export async function getSystemStats() {
  try {
    const rows = await query(`
      SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions) AS active_users,
        (SELECT COUNT(DISTINCT station_id) FROM station_daily_reports) AS total_stations,
        (SELECT COALESCE(SUM(total_kwh), 0) FROM station_daily_reports) AS total_energy_kwh,
        (SELECT COALESCE(SUM(revenue), 0) FROM station_daily_reports) AS total_revenue
    `);

    const stats = rows[0] || {};
    return {
      active_users: Number(stats.active_users ?? 0),
      total_stations: Number(stats.total_stations ?? 0),
      total_energy_kwh: Number(stats.total_energy_kwh ?? 0)
    };
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return {
        active_users: 0,
        total_stations: 0,
        total_energy_kwh: 0,
        total_revenue: 0
      };
    }
    throw error;
  }
}

// ===== 2️⃣ Phân tích hành vi người dùng =====
export async function analyzeUserBehavior() {
  try {
    const rows = await query(`
      SELECT 
        user_id,
        COUNT(session_id) AS total_sessions,
        AVG(session_duration) AS avg_duration,
        AVG(energy_used) AS avg_energy
      FROM user_sessions
      GROUP BY user_id
      ORDER BY total_sessions DESC
      LIMIT 1
    `);

    return rows.map((u) => ({
      ...u,
      category:
        u.total_sessions > 50
          ? "Power User"
          : u.total_sessions > 10
          ? "Regular"
          : "Casual",
      total_sessions: Number(u.total_sessions ?? 0),
      avg_duration: u.avg_duration != null ? Number(u.avg_duration) : null,
      avg_energy: u.avg_energy != null ? Number(u.avg_energy) : null
    }));
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }
}

// ===== 3️⃣ Dự báo nhu cầu trạm sạc =====
export async function forecastStationDemand({ stationId, days = 7 }) {
  const horizon = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : 7;

  const data = await query(
    `SELECT report_date AS date, SUM(sessions) AS total_usage
     FROM station_daily_reports
     WHERE station_id = ?
     GROUP BY report_date
     ORDER BY report_date ASC`,
    [stationId]
  );

  if (data.length === 0) return [];

  // Dự báo theo trung bình động (Simple Moving Average)
  const usages = data.map((d) => Number(d.total_usage));
  const windowSize = 3;
  const forecast = [];

  for (let i = 0; i < horizon; i++) {
    const recent = usages.slice(-windowSize);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    usages.push(avg);
    forecast.push({
      day: i + 1,
      predicted_usage: Number(avg.toFixed(2))
    });
  }

  return forecast;
}
