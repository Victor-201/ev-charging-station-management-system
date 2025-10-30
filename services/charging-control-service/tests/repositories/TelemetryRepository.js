const pool = require('../../db');
const Telemetry = require('../models/Telemetry');

class TelemetryRepository {
  async add(telemetry) {
    const [result] = await pool.query(
      `INSERT INTO telemetry (session_id, timestamp, meter_wh, power_kw, soc)
       VALUES (?, ?, ?, ?, ?)`,
      [
        telemetry.session_id,
        telemetry.timestamp,
        telemetry.meter_wh,
        telemetry.power_kw,
        telemetry.soc
      ]
    );
    telemetry.telemetry_id = result.insertId;
    return telemetry;
  }

  async getBySession(session_id, limit = 100) {
    const [rows] = await pool.query(
      `SELECT * FROM telemetry WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [session_id, limit]
    );
    return rows.map(r => Telemetry.fromRow(r));
  }

  async deleteBySession(session_id) {
    await pool.query('DELETE FROM telemetry WHERE session_id = ?', [session_id]);
  }
}

module.exports = TelemetryRepository;
