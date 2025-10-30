const pool = require('../config/db');
const QrCode = require('../models/QrCode');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

class QrCodeRepository {
  /**
   * Create new QR code
   */
  async create({ reservation_id, user_id, expires_in = 600 }) {
    const qr_id = uuidv4();
    const url = `https://example.com/qr/${qr_id}`;
    const created_at = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const expires_at = dayjs().utc().add(expires_in, 'second').format('YYYY-MM-DD HH:mm:ss');

    const qr = new QrCode({
      qr_id,
      reservation_id,
      user_id,
      url,
      status: 'active',
      expires_in,
      created_at,
    });

    const sql = `
      INSERT INTO qr_codes (qr_id, reservation_id, user_id, url, status, expires_in, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [qr.qr_id, qr.reservation_id, qr.user_id, qr.url, qr.status, qr.expires_in, created_at]);

    return { ...qr, expires_at };
  }

  /**
   * Find QR code by ID
   */
  async findById(qr_id) {
    const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id=?', [qr_id]);
    return rows[0] ? new QrCode(rows[0]) : null;
  }

  /**
   * Mark QR as used
   */
  async markUsed(qr_id) {
    await pool.query('UPDATE qr_codes SET status="used" WHERE qr_id=?', [qr_id]);
  }

  /**
   * Expire old QR codes
   */
  async markExpired() {
    await pool.query(`
      UPDATE qr_codes
      SET status="expired"
      WHERE status="active"
      AND DATE_ADD(created_at, INTERVAL expires_in SECOND) < NOW()
    `);
  }

  /**
   * Check if QR code is valid and not expired
   */
  async validate(qr_id) {
    const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id=?', [qr_id]);
    if (!rows.length) return { valid: false };

    const qr = rows[0];
    const expired = dayjs(qr.created_at).add(qr.expires_in, 'second').isBefore(dayjs());
    if (expired || qr.status !== 'active') return { valid: false };

    return { valid: true, reservation_id: qr.reservation_id };
  }
}

module.exports = new QrCodeRepository();
