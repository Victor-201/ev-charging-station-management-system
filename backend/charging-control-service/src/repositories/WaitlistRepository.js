// repositories/WaitlistRepository.js
const pool = require('../config/db'); // mysql2/promise pool
const Waitlist = require('../models/Waitlist');
const { v4: uuidv4 } = require('uuid');

class WaitlistRepository {
  /**
   * Create new waitlist entry in transaction-safe way:
   * - lock relevant rows by using SELECT MAX(position) FOR UPDATE
   * - then INSERT with position = max+1
   */
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Ensure we use same station+connector rows locked
      const [rows] = await conn.query(
        'SELECT MAX(position) AS max_pos FROM waitlist WHERE station_id = ? AND connector_type = ? FOR UPDATE',
        [data.station_id, data.connector_type]
      );
      const nextPos = (rows[0]?.max_pos || 0) + 1;
      const waitlist_id = data.waitlist_id || uuidv4();
      const status = data.status || 'waiting';

      const sql = `
        INSERT INTO waitlist (
          waitlist_id, user_id, station_id, connector_type,
          position, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await conn.query(sql, [
        waitlist_id,
        data.user_id,
        data.station_id,
        data.connector_type,
        nextPos,
        status,
      ]);

      await conn.commit();

      return new Waitlist({
        waitlist_id,
        user_id: data.user_id,
        station_id: data.station_id,
        connector_type: data.connector_type,
        position: nextPos,
        status,
        created_at: new Date(),
      });
    } catch (err) {
      await conn.rollback().catch(() => {});
      throw err;
    } finally {
      conn.release();
    }
  }

  async getNextPosition(station_id, connector_type) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM waitlist WHERE station_id = ? AND connector_type = ?',
      [station_id, connector_type]
    );
    return (rows[0]?.cnt || 0) + 1;
  }

  async findById(waitlist_id) {
    const [rows] = await pool.query('SELECT * FROM waitlist WHERE waitlist_id = ? LIMIT 1', [waitlist_id]);
    return rows[0] ? new Waitlist(rows[0]) : null;
  }

  async findActiveByStation(station_id) {
    const [rows] = await pool.query(
      'SELECT * FROM waitlist WHERE station_id = ? AND status = "waiting" ORDER BY position ASC',
      [station_id]
    );
    return rows.map(r => new Waitlist(r));
  }

  async update(waitlist) {
    const sql = `UPDATE waitlist SET position = ?, status = ?, updated_at = NOW() WHERE waitlist_id = ?`;
    await pool.query(sql, [waitlist.position, waitlist.status, waitlist.waitlist_id]);
    return waitlist;
  }

  async delete(waitlist_id) {
    await pool.query('DELETE FROM waitlist WHERE waitlist_id = ?', [waitlist_id]);
  }
}

module.exports = new WaitlistRepository();
