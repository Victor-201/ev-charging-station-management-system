const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const Session = require('../models/Session');

class SessionRepository {
  /**
   * Tạo session mới (trạng thái initiated)
   */
  async create({ user_id, point_id, vehicle_id, auth_method, reservation_id }) {
    const session = new Session({
      session_id: uuidv4(),
      user_id,
      point_id,
      vehicle_id: vehicle_id || null,
      auth_method: auth_method || null,
      reservation_id: reservation_id || null,
      status: 'initiated',
      created_at: new Date(),
    });

    const q = `
      INSERT INTO sessions 
      (session_id, user_id, point_id, vehicle_id, auth_method, reservation_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(q, [
      session.session_id,
      session.user_id,
      session.point_id,
      session.vehicle_id,
      session.auth_method,
      session.reservation_id,
      session.status,
      session.created_at,
    ]);

    return session;
  }

  /**
   * Lấy session theo ID
   */
  async findById(session_id) {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return rows[0] ? new Session(rows[0]) : null;
  }

  /**
   * Cập nhật trạng thái session
   */
  async updateStatus(session_id, status, extra = {}) {
    const fields = [];
    const values = [];

    fields.push('status = ?');
    values.push(status);

    if (extra.start_meter_wh != null) {
      fields.push('start_meter_wh = ?');
      values.push(extra.start_meter_wh);
    }

    if (extra.started_at) {
      fields.push('started_at = ?');
      values.push(extra.started_at);
    }

    if (extra.ended_at) {
      fields.push('ended_at = ?');
      values.push(extra.ended_at);
    }

    if (extra.end_meter_wh != null) {
      fields.push('end_meter_wh = ?');
      values.push(extra.end_meter_wh);
    }

    if (extra.kwh != null) {
      fields.push('kwh = ?');
      values.push(extra.kwh);
    }

    if (extra.cost != null) {
      fields.push('cost = ?');
      values.push(extra.cost);
    }

    const q = `UPDATE sessions SET ${fields.join(', ')} WHERE session_id = ?`;
    values.push(session_id);

    await pool.query(q, values);
  }

  /**
   * Kiểm tra session tồn tại
   */
  async exists(session_id) {
    const [rows] = await pool.query('SELECT 1 FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return Array.isArray(rows) && rows.length > 0;
  }

  /**
   * Lấy trạng thái session (để xác minh logic trong service)
   */
  async getStatus(session_id) {
    const [rows] = await pool.query('SELECT status FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return rows[0]?.status || null;
  }

  /**
   * Cập nhật khi kết thúc session (có tính toán kWh + cost)
   */
  async markFinished(session_id, { end_meter_wh, kwh, cost }) {
    const ended_at = dayjs().toDate();
    await pool.query(
      `
      UPDATE sessions
      SET status = ?, end_meter_wh = ?, kwh = ?, cost = ?, ended_at = ?
      WHERE session_id = ?
      `,
      ['finished', end_meter_wh, kwh, cost, ended_at, session_id]
    );
    return { session_id, status: 'finished', kwh, cost };
  }

  /**
   * Lấy lịch sử start/stop event
   */
  async getEvents(session_id) {
    const [rows] = await pool.query(
      'SELECT started_at, ended_at FROM sessions WHERE session_id = ? LIMIT 1',
      [session_id]
    );
    if (!rows.length) return [];
    const s = rows[0];
    const events = [];
    if (s.started_at) events.push({ type: 'start', ts: new Date(s.started_at).toISOString() });
    if (s.ended_at) events.push({ type: 'stop', ts: new Date(s.ended_at).toISOString() });
    return events;
  }
}

module.exports = new SessionRepository();
