const pool = require('../config/db');
const Telemetry = require('../models/Telemetry');
const dayjs = require('dayjs');

class TelemetryRepository {

  /**
   * Tạo hoặc cập nhật telemetry (vì chỉ có 1 telemetry/session)
   */
  async upsert({ session_id, meter_wh, power_kw, price_per_kw = null, soc }) {
    const existing = await this.getBySessionId(session_id);

    if (existing) {
      // Update bản hiện tại
      const sql = `
        UPDATE telemetry
        SET meter_wh = ?, power_kw = ?, price_per_kw = ?, soc = ?
        WHERE session_id = ?
      `;
      await pool.query(sql, [meter_wh, power_kw, price_per_kw, soc, session_id]);
      return { session_id, meter_wh, power_kw, price_per_kw, soc };
    } else {
      // Tạo mới
      const telemetry_id = require('uuid').v4();
      const timestamp = dayjs().toISOString();

      const sql = `
        INSERT INTO telemetry
          (telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(sql, [
        telemetry_id,
        session_id,
        timestamp,
        meter_wh,
        power_kw,
        price_per_kw,
        soc,
      ]);

      return { telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc };
    }
  }

  /**
   * Lấy telemetry theo session_id
   */
  async getBySessionId(session_id) {
    const sql = `
      SELECT telemetry_id, session_id, timestamp, meter_wh, power_kw, price_per_kw, soc
      FROM telemetry
      WHERE session_id = ?
    `;
    const [rows] = await pool.query(sql, [session_id]);
    if (!rows.length) return null;
    return new Telemetry(rows[0]);
  }
}

module.exports = new TelemetryRepository();
