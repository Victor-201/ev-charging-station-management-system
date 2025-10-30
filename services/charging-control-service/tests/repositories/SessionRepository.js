const pool = require('../../db');
const Session = require('../models/Session');

class SessionRepository {
  async create(session) {
    await pool.query(
      `INSERT INTO sessions 
      (session_id, user_id, point_id, vehicle_id, reservation_id, start_meter_wh, end_meter_wh, status, started_at, ended_at, cost, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.session_id,
        session.user_id,
        session.point_id,
        session.vehicle_id,
        session.reservation_id,
        session.start_meter_wh,
        session.end_meter_wh,
        session.status,
        session.started_at,
        session.ended_at,
        session.cost,
        JSON.stringify(session.metadata || {})
      ]
    );
    return session;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ?', [id]);
    return rows[0] ? Session.fromRow(rows[0]) : null;
  }

  async findActiveByUser(user_id) {
    const [rows] = await pool.query(
      `SELECT * FROM sessions WHERE user_id = ? AND status IN ('initiated', 'charging')`,
      [user_id]
    );
    return rows.map(r => Session.fromRow(r));
  }

  async updateStatus(id, status) {
    await pool.query('UPDATE sessions SET status = ? WHERE session_id = ?', [status, id]);
  }

  async updateMeters(id, start_wh, end_wh) {
    await pool.query(
      `UPDATE sessions SET start_meter_wh = ?, end_meter_wh = ? WHERE session_id = ?`,
      [start_wh, end_wh, id]
    );
  }

  async delete(id) {
    await pool.query('DELETE FROM sessions WHERE session_id = ?', [id]);
  }
}

module.exports = SessionRepository;
