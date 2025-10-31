const pool = require('../config/db');
const Telemetry = require('../models/Telemetry');
const dayjs = require('dayjs');

class TelemetryRepository {
  /**
   * Thêm bản ghi telemetry mới
   */
  async create({ session_id, timestamp, meter_wh, power_kw, soc }) {
    const t = new Telemetry({
      session_id,
      timestamp: dayjs(timestamp || new Date()).format('YYYY-MM-DD HH:mm:ss'),
      meter_wh,
      power_kw,
      soc,
    });

    await pool.query(
      `
      INSERT INTO telemetry (session_id, timestamp, meter_wh, power_kw, soc)
      VALUES (?, ?, ?, ?, ?)
      `,
      [t.session_id, t.timestamp, t.meter_wh, t.power_kw, t.soc]
    );

    return t;
  }

  /**
   * Lấy telemetry theo session_id, có filter theo from/to/limit
   */
  async getBySessionId(session_id, { from, to, limit = 100 }) {
    let q = 'SELECT timestamp, meter_wh, power_kw, soc FROM telemetry WHERE session_id = ?';
    const params = [session_id];

    if (from) {
      q += ' AND timestamp >= ?';
      params.push(dayjs(from).format('YYYY-MM-DD HH:mm:ss'));
    }

    if (to) {
      q += ' AND timestamp <= ?';
      params.push(dayjs(to).format('YYYY-MM-DD HH:mm:ss'));
    }

    limit = Number(limit) || 100;
    const MAX_LIMIT = 5000;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    q += ' ORDER BY timestamp ASC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(q, params);

    return rows.map(r => new Telemetry({
      session_id,
      timestamp: new Date(r.timestamp).toISOString(),
      meter_wh: r.meter_wh,
      power_kw: r.power_kw,
      soc: r.soc,
    }));
  }
}

module.exports = new TelemetryRepository();
