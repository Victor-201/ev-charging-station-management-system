const pool = require('../../db');
const Waitlist = require('../models/Waitlist');

class WaitlistRepository {
  async create(waitlist) {
    await pool.query(
      `INSERT INTO waitlist (waitlist_id, user_id, station_id, connector_type, position, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(3))`,
      [
        waitlist.waitlist_id,
        waitlist.user_id,
        waitlist.station_id,
        waitlist.connector_type,
        waitlist.position
      ]
    );
    return waitlist;
  }

  async getByStation(station_id) {
    const [rows] = await pool.query(
      `SELECT * FROM waitlist WHERE station_id = ? ORDER BY position ASC`,
      [station_id]
    );
    return rows.map(r => Waitlist.fromRow(r));
  }

  async remove(waitlist_id) {
    await pool.query('DELETE FROM waitlist WHERE waitlist_id = ?', [waitlist_id]);
  }

  async findByUser(user_id) {
    const [rows] = await pool.query('SELECT * FROM waitlist WHERE user_id = ?', [user_id]);
    return rows.map(r => Waitlist.fromRow(r));
  }

  async clearStation(station_id) {
    await pool.query('DELETE FROM waitlist WHERE station_id = ?', [station_id]);
  }
}

module.exports = WaitlistRepository;
