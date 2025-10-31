const pool = require('../config/db');
const Reservation = require('../models/Reservation');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

class ReservationRepository {
  /**
   * Convert to UTC datetime format for SQL
   */
  toSqlDatetimeIsoZ(input) {
    return dayjs(input).utc().format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Create a new reservation
   * @param {Object} data - Reservation info
   * @returns {Reservation}
   */
  async create(data) {
    const reservation = new Reservation({
      reservation_id: data.reservation_id || uuidv4(),
      status: data.status || 'confirmed',
      ...data,
    });

    const sql = `
      INSERT INTO reservations (
        reservation_id, user_id, station_id, point_id, connector_type,
        start_time, end_time, status, expires_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await pool.query(sql, [
      reservation.reservation_id,
      reservation.user_id,
      reservation.station_id,
      reservation.point_id,
      reservation.connector_type,
      this.toSqlDatetimeIsoZ(reservation.start_time),
      this.toSqlDatetimeIsoZ(reservation.end_time),
      reservation.status,
      this.toSqlDatetimeIsoZ(reservation.expires_at),
    ]);

    return reservation;
  }

  /**
   * Find reservation by ID
   */
  async findById(reservation_id) {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ?', [reservation_id]);
    return rows[0] ? new Reservation(rows[0]) : null;
  }

  /**
   * Get all reservations of a user
   */
  async findByUser(user_id) {
    const [rows] = await pool.query(
      'SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows.map((r) => new Reservation(r));
  }

  /**
   * Update reservation info
   */
  async update(reservation) {
    const sql = `
      UPDATE reservations
      SET start_time=?, end_time=?, status=?, updated_at=NOW()
      WHERE reservation_id=?
    `;
    await pool.query(sql, [
      this.toSqlDatetimeIsoZ(reservation.start_time),
      this.toSqlDatetimeIsoZ(reservation.end_time),
      reservation.status,
      reservation.reservation_id,
    ]);
    return reservation;
  }

  /**
   * Mark reservation as cancelled
   */
  async markCancelled(reservation_id) {
    await pool.query('UPDATE reservations SET status="cancelled", updated_at=NOW() WHERE reservation_id=?', [reservation_id]);
  }

  /**
   * Delete reservation permanently
   */
  async delete(reservation_id) {
    await pool.query('DELETE FROM reservations WHERE reservation_id=?', [reservation_id]);
  }

  /**
   * Check if a charging point is available in a given time range
   */
  async checkAvailability(station_id, point_id, start_time, end_time) {
    const start = this.toSqlDatetimeIsoZ(start_time);
    const end = this.toSqlDatetimeIsoZ(end_time);

    const q = `
      SELECT COUNT(*) AS cnt 
      FROM reservations 
      WHERE station_id = ? 
        AND point_id = ? 
        AND status = 'confirmed'
        AND NOT (end_time <= ? OR start_time >= ?)
    `;

    const [rows] = await pool.query(q, [station_id, point_id, start, end]);
    return rows[0].cnt === 0;
  }

  /**
   * Auto-cancel expired reservations (not started on time)
   */
  async autoCancelExpired(minutes = 20) {
    const threshold = dayjs().utc().subtract(minutes, 'minute').format('YYYY-MM-DD HH:mm:ss');
    const [rows] = await pool.query(
      `SELECT reservation_id FROM reservations WHERE status='confirmed' AND start_time < ?`,
      [threshold]
    );

    if (!rows.length) return [];

    const ids = rows.map((r) => r.reservation_id);
    await pool.query(
      `UPDATE reservations SET status='cancelled', updated_at=NOW() WHERE reservation_id IN (?)`,
      [ids]
    );
    return ids;
  }
}

module.exports = new ReservationRepository();
