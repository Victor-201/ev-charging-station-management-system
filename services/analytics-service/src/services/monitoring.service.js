import { query } from '../config/database.js';

export const getSystemHealth = async () => {
  const services = await query(
    'SELECT service_name AS name, status FROM monitoring_services ORDER BY service_name'
  );

  if (!services.length) {
    return { status: 'unknown', services: {} };
  }

  const summary = services.reduce(
    (acc, item) => ({
      status: item.status === 'down' ? 'down' : acc.status === 'down' ? 'down' : acc.status,
      services: { ...acc.services, [item.name]: item.status }
    }),
    { status: 'ok', services: {} }
  );

  return summary;
};

export const getMetricsSeries = async ({ metric, from, to, step }) => {
  if (!metric) {
    throw new Error('metric is required');
  }

  const params = [metric];
  let where = 'WHERE metric = ?';

  if (from) {
    where += ' AND bucket >= ?';
    params.push(from);
  }
  if (to) {
    where += ' AND bucket <= ?';
    params.push(to);
  }
  if (step) {
    where += ' AND bucket_interval = ?';
    params.push(step);
  }

  const rows = await query(
    `SELECT bucket, avg_value
     FROM monitoring_metrics
     ${where}
     ORDER BY bucket ASC`,
    params
  );

  return {
    metric,
    values: rows.map((row) => [Number(row.avg_value)])
  };
};

export const searchLogs = async ({ keyword, from, to, level, page, size }) => {
  const limit = Number(size ?? 20) || 20;
  const pageNumber = Number(page ?? 1) || 1;
  const offset = (pageNumber - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (keyword) {
    where += ' AND (message LIKE ? OR service_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (from) {
    where += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    where += ' AND created_at <= ?';
    params.push(to);
  }
  if (level) {
    where += ' AND level = ?';
    params.push(level);
  }

  const rows = await query(
    `SELECT log_id AS id, created_at AS ts, service_name AS service, level, message
     FROM monitoring_logs
     ${where}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const logs = rows.map((row) => {
    let timestamp;
    if (row.ts instanceof Date) {
      timestamp = row.ts.toISOString().replace('.000Z', 'Z');
    } else if (typeof row.ts === 'string') {
      timestamp = new Date(`${row.ts.replace(' ', 'T')}Z`).toISOString().replace('.000Z', 'Z');
    } else {
      timestamp = row.ts;
    }

    return {
      ts: timestamp,
      service: row.service,
      message: row.message
    };
  });

  return { logs };
};

export const listActiveAlerts = async () => {
  const rows = await query(
    `SELECT alert_id AS id, type, status
     FROM monitoring_alerts
     WHERE status IN ('firing', 'acknowledged')
     ORDER BY triggered_at DESC`
  );
  return { alerts: rows };
};

export const acknowledgeAlert = async ({ alertId, userId }) => {
  const result = await query(
    `UPDATE monitoring_alerts
     SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE alert_id = ? AND status != 'resolved'`,
    [userId, alertId]
  );

  if (!result.affectedRows) {
    return { success: false };
  }

  return { success: true };
};
