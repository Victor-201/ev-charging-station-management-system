const pool = require('../config/db');
const { db } = require('../models'); // This line causes a circular dependency
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
    return input ? dayjs(input).utc().format('YYYY-MM-DD HH:mm:ss') : null;
  }

  /**
   * Create a new reservation
   */
  async create(data) {
  const reservation = new Reservation({
  reservation_id: data.reservation_id || uuidv4(),
  status: data.status || 'confirmed',
  price_per_min: data.price_per_min || 1000,
  reserved_minutes: data.reserved_minutes || null,
  total_cost: data.total_cost || 0,
  ...data,
});

const sql = `
INSERT INTO reservations (
  reservation_id, user_id, station_id, point_id, connector_type,
  start_time, end_time, status, expires_at,
  price_per_min, reserved_minutes, total_cost, final_cost,
  created_at, updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  NOW(), NOW())
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
  reservation.price_per_min,
  reservation.reserved_minutes,
  reservation.total_cost,
  reservation.final_cost || null,
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
  SET start_time=?, end_time=?, status=?, expires_at=?,
      price_per_min=?, reserved_minutes=?, total_cost=?, updated_at=NOW()
  WHERE reservation_id=?
`;

await pool.query(sql, [
  this.toSqlDatetimeIsoZ(reservation.start_time),
  this.toSqlDatetimeIsoZ(reservation.end_time),
  reservation.status,
  this.toSqlDatetimeIsoZ(reservation.expires_at),
  reservation.price_per_min,
  reservation.reserved_minutes,
  reservation.total_cost,
  reservation.reservation_id,
]);

  return reservation;
}


  /**
   * Update only cost fields (để service gọi sau khi tính tiền)
   */
async updateCost(reservation_id, reserved_minutes, total_cost, payment_method = null) {
  const fields = ['reserved_minutes=?, total_cost=?'];
  const params = [reserved_minutes, total_cost];

  if (['wallet','bank_transfer','momo'].includes(payment_method)) {
    fields.push('payment_method=?');
    params.push(payment_method);
  }

  params.push(reservation_id);

  await pool.query(
    `UPDATE reservations SET ${fields.join(', ')}, updated_at=NOW() WHERE reservation_id=?`,
    params
  );
}


  /**
   * Mark reservation as cancelled
   */
  async markCancelled(reservation_id) {
    await pool.query(
      'UPDATE reservations SET status="cancelled", updated_at=NOW() WHERE reservation_id=?',
      [reservation_id]
    );
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
   * Auto-cancel expired reservations
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
