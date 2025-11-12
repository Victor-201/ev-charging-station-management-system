// src/repositories/QrCodeRepository.js
const pool = require('../config/db');
const QrCode = require('../models/QrCode');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

class QrCodeRepository {
  /**
   * Create new QR code
   * opts: { reservation_id, expires_in }
   */
  async create({ reservation_id, expires_in = 600 } = {}) {
    if (!reservation_id) {
      throw new Error('reservation_id is required');
    }

    const qr_id = uuidv4();
    const url = `https://example.com/qr/${qr_id}`;
    const created_at = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const expires_at = dayjs().utc().add(Number(expires_in), 'second').format('YYYY-MM-DD HH:mm:ss');

    const qr = new QrCode({
      qr_id,
      reservation_id,
      url,
      expires_in: Number(expires_in),
      created_at,
    });

    // ✅ Bỏ cột `status`
    const sql = `
      INSERT INTO qr_codes (qr_id, reservation_id, url, expires_in, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [
      qr.qr_id,
      qr.reservation_id,
      qr.url,
      qr.expires_in,
      created_at,
    ]);

    return {
      qr_id: qr.qr_id,
      reservation_id: qr.reservation_id,
      url: qr.url,
      expires_in: qr.expires_in,
      created_at,
      expires_at,
    };
  }

  /**
   * Find QR code by ID
   */
  async findById(qr_id) {
    const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id=?', [qr_id]);
    return rows[0] ? new QrCode(rows[0]) : null;
  }

  /**
   * Delete expired QR codes (vì không có status)
   */
  async removeExpired() {
    await pool.query(`
      DELETE FROM qr_codes
      WHERE DATE_ADD(created_at, INTERVAL expires_in SECOND) < NOW()
    `);
  }

  /**
   * Check if QR code is valid (not expired)
   */
  // src/repositories/QrCodeRepository.js (chỉ phần validate)
async validate(qr_id) {
  const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id=?', [qr_id]);

  if (!rows.length) {
    console.log('[QrCodeRepository.validate] QR not found');
    return { valid: false };
  }

  const qr = rows[0];
  const createdAtUtc = dayjs.utc(qr.created_at);
  const expiresAtUtc = createdAtUtc.add(Number(qr.expires_in || 0), 'second');
  const nowUtc = dayjs.utc();

  const expired = expiresAtUtc.isBefore(nowUtc);
  if (expired) {
    console.log('[QrCodeRepository.validate] QR expired');
    return { valid: false };
  }

  console.log('[QrCodeRepository.validate] QR valid, reservation_id=', qr.reservation_id);
  return { valid: true, reservation_id: qr.reservation_id };
}

}

module.exports = new QrCodeRepository();
