const pool = require('../config/db');
const dayjs = require('dayjs');

class SessionRepository {
  /**
   * Tạo session mới (trạng thái initiated)
   * session object expected keys: session_id, reservation_id, point_id, user_id, vehicle_id, auth_method, status, created_at, updated_at
   */
  async create(session) {
    if (!session) throw new Error('Missing session object');
    if (!session.session_id) throw new Error('session.session_id is required');
    if (!session.user_id) throw new Error('session.user_id is required');
    if (!session.point_id) throw new Error('session.point_id is required');

    const q = `
      INSERT INTO sessions
        (session_id, reservation_id, point_id, user_id, vehicle_id, auth_method,
         start_meter_wh, end_meter_wh, started_at, ended_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      session.session_id,
      session.reservation_id || null,
      session.point_id,
      session.user_id,
      session.vehicle_id || null,
      session.auth_method || null,
      session.start_meter_wh != null ? session.start_meter_wh : null,
      session.end_meter_wh != null ? session.end_meter_wh : null,
      session.started_at || null,
      session.ended_at || null,
      session.status || 'initiated',
      session.created_at || dayjs().toISOString(),
      session.updated_at || dayjs().toISOString(),
    ];

    await pool.query(q, values);

    // trả về object session (consistent shape)
    return {
      session_id: session.session_id,
      reservation_id: session.reservation_id || null,
      point_id: session.point_id,
      user_id: session.user_id,
      vehicle_id: session.vehicle_id || null,
      auth_method: session.auth_method || null,
      start_meter_wh: values[6],
      end_meter_wh: values[7],
      started_at: values[8],
      ended_at: values[9],
      status: values[10],
      created_at: values[11],
      updated_at: values[12],
    };
  }

  async getById(session_id) {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return rows[0] || null;
  }

  /**
   * Cập nhật bất kỳ trường nào cần thiết (status + extras)
   * extra: object các trường bổ sung: start_meter_wh, end_meter_wh, started_at, ended_at, kwh, cost
   */
  async updateStatus(session_id, status, extra = {}) {
  if (!session_id) throw new Error('session_id is required');
  if (!status) throw new Error('status is required');

  const sets = [];
  const vals = [];

  sets.push('status = ?'); vals.push(status);

  if (extra.start_meter_wh != null) { sets.push('start_meter_wh = ?'); vals.push(extra.start_meter_wh); }
  if (extra.end_meter_wh != null)   { sets.push('end_meter_wh = ?'); vals.push(extra.end_meter_wh); }
  if (extra.started_at)             { sets.push('started_at = ?'); vals.push(extra.started_at); }
  if (extra.ended_at)               { sets.push('ended_at = ?'); vals.push(extra.ended_at); }
  if (extra.kwh != null)            { sets.push('kwh = ?'); vals.push(extra.kwh); }
  if (extra.cost != null)           { sets.push('cost = ?'); vals.push(extra.cost); }

  // **use MySQL-friendly datetime format**
  sets.push('updated_at = ?'); vals.push(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));

  const q = `UPDATE sessions SET ${sets.join(', ')} WHERE session_id = ?`;
  vals.push(session_id);

  await pool.query(q, vals);

  return this.getById(session_id);
}

  async exists(session_id) {
    const [rows] = await pool.query('SELECT 1 FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return Array.isArray(rows) && rows.length > 0;
  }

  async getEvents(session_id) {
    const [rows] = await pool.query('SELECT started_at, ended_at FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    if (!rows.length) return [];
    const r = rows[0];
    const events = [];
    if (r.started_at) events.push({ type: 'start', ts: new Date(r.started_at).toISOString() });
    if (r.ended_at)   events.push({ type: 'stop',  ts: new Date(r.ended_at).toISOString() });
    return events;
  }
}

module.exports = new SessionRepository();
