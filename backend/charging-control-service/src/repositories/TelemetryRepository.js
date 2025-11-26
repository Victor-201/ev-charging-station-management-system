// src/repositories/TelemetryRepository.js
const pool = require('../config/db');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const Telemetry = require('../models/Telemetry');

class TelemetryRepository {
async upsertBySession(session_id, { meter_wh, power_kw = null, price_per_kw = null, soc = null, timestamp = null }) {
  if (!session_id) throw new Error('session_id is required');
  if (meter_wh == null || isNaN(Number(meter_wh))) throw new Error('meter_wh is required');

  const ts = timestamp || dayjs().format("YYYY-MM-DD HH:mm:ss");

  // Lấy telemetry hiện tại nếu có
  let telemetry;
  try {
    telemetry = await this.getBySessionId(session_id);
  } catch (e) {
    telemetry = null; // chưa có
  }

  const telemetry_id = telemetry ? telemetry.telemetry_id : uuidv4();

  const sql = `
    INSERT INTO telemetry (telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      meter_wh = VALUES(meter_wh),
      power_kw = VALUES(power_kw),
      price_per_kw = VALUES(price_per_kw),
      soc = VALUES(soc),
      timestamp = VALUES(timestamp)
  `;

  await pool.query(sql, [telemetry_id, session_id, ts, meter_wh, power_kw, price_per_kw, soc]);

  const [rows] = await pool.query(
    `SELECT telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc 
     FROM telemetry WHERE session_id = ?`,
    [session_id]
  );

  return new Telemetry(rows[0]);
}


  async getBySessionId(session_id) {
    if (!session_id) throw new Error('session_id is required');

    const sql = `
      SELECT telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc
      FROM telemetry
      WHERE session_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [session_id]);
    if (!rows[0]) throw new Error(`No telemetry found for session_id ${session_id}`);
    return new Telemetry(rows[0]);
  }

  async deleteBySessionId(session_id) {
    if (!session_id) throw new Error('session_id is required');
    const sql = `DELETE FROM telemetry WHERE session_id = ?`;
    const [result] = await pool.query(sql, [session_id]);
    return { deleted: result.affectedRows };
  }

  async deleteById(telemetry_id) {
    if (!telemetry_id) throw new Error('telemetry_id is required');
    const sql = `DELETE FROM telemetry WHERE telemetry_id = ?`;
    const [result] = await pool.query(sql, [telemetry_id]);
    return { deleted: result.affectedRows };
  }
}

module.exports = new TelemetryRepository();
