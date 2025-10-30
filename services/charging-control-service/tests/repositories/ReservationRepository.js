const pool = require('../../db');
const Reservation = require('../models/Reservation');

class ReservationRepository {
  async create(reservation) {
    await pool.query(
      `INSERT INTO reservations 
      (reservation_id, user_id, station_id, point_id, connector_type, start_time, end_time, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reservation.reservation_id,
        reservation.user_id,
        reservation.station_id,
        reservation.point_id,
        reservation.connector_type,
        reservation.start_time,
        reservation.end_time,
        reservation.status,
        reservation.expires_at
      ]
    );
    return reservation;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ?', [id]);
    return rows[0] ? Reservation.fromRow(rows[0]) : null;
  }

  async findByUser(user_id) {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE user_id = ?', [user_id]);
    return rows.map(r => Reservation.fromRow(r));
  }

  async updateStatus(id, status) {
    await pool.query('UPDATE reservations SET status = ? WHERE reservation_id = ?', [status, id]);
  }

  async delete(id) {
    await pool.query('DELETE FROM reservations WHERE reservation_id = ?', [id]);
  }
}

module.exports = ReservationRepository;
