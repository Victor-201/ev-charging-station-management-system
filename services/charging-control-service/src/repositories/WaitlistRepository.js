const pool = require('../config/db');
const Waitlist = require('../models/Waitlist');
const { v4: uuidv4 } = require('uuid');

class WaitlistRepository {
  /**
   * Create new waitlist entry
   */
  async create(data) {
    const position = await this.getNextPosition(data.station_id, data.connector_type);
    const waitlist = new Waitlist({
      waitlist_id: data.waitlist_id || uuidv4(),
      status: data.status || 'waiting',
      position,
      ...data,
    });

    const sql = `
      INSERT INTO waitlist (
        waitlist_id, user_id, station_id, connector_type,
        position, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    await pool.query(sql, [
      waitlist.waitlist_id,
      waitlist.user_id,
      waitlist.station_id,
      waitlist.connector_type,
      waitlist.position,
      waitlist.status,
    ]);

    return waitlist;
  }

  /**
   * Get next available position for waitlist queue
   */
  async getNextPosition(station_id, connector_type) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM waitlist WHERE station_id = ? AND connector_type = ?',
      [station_id, connector_type]
    );
    return (rows[0]?.cnt || 0) + 1;
  }

  /**
   * Find waitlist entry by ID
   */
  async findById(waitlist_id) {
    const [rows] = await pool.query('SELECT * FROM waitlist WHERE waitlist_id = ?', [waitlist_id]);
    return rows[0] ? new Waitlist(rows[0]) : null;
  }

  /**
   * Find all waiting users for a station
   */
  async findActiveByStation(station_id) {
    const [rows] = await pool.query(
      'SELECT * FROM waitlist WHERE station_id = ? AND status="waiting" ORDER BY position ASC',
      [station_id]
    );
    return rows.map((r) => new Waitlist(r));
  }

  /**
   * Update waitlist info
   */
  async update(waitlist) {
    const sql = `UPDATE waitlist SET position=?, status=? WHERE waitlist_id=?`;
    await pool.query(sql, [waitlist.position, waitlist.status, waitlist.waitlist_id]);
    return waitlist;
  }

  /**
   * Remove user from waitlist
   */
  async delete(waitlist_id) {
    await pool.query('DELETE FROM waitlist WHERE waitlist_id=?', [waitlist_id]);
  }
}

module.exports = new WaitlistRepository();
