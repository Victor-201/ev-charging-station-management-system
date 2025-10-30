const pool = require('../../db');
const QrCode = require('../models/QrCode');

class QrCodeRepository {
  async create(qr) {
    await pool.query(
      `INSERT INTO qr_codes (qr_id, reservation_id, user_id, url, expires_in, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        qr.qr_id,
        qr.reservation_id,
        qr.user_id,
        qr.url,
        qr.expires_in,
        qr.status
      ]
    );
    return qr;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id = ?', [id]);
    return rows[0] ? QrCode.fromRow(rows[0]) : null;
  }

  async findByReservation(reservation_id) {
    const [rows] = await pool.query('SELECT * FROM qr_codes WHERE reservation_id = ?', [reservation_id]);
    return rows.map(r => QrCode.fromRow(r));
  }

  async markUsed(id) {
    await pool.query('UPDATE qr_codes SET status = "used" WHERE qr_id = ?', [id]);
  }

  async deleteExpired() {
    await pool.query('DELETE FROM qr_codes WHERE status = "expired" OR TIMESTAMPDIFF(SECOND, created_at, NOW()) > expires_in');
  }
}

module.exports = QrCodeRepository;
