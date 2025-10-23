const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { publish } = require('../rabbit'); // 🔥 thêm để dùng RabbitMQ

/**
 * Tạo QR code cho đặt chỗ
 * @param {Object} params
 * @param {string} params.reservation_id
 * @param {number} params.expires_in (giây)
 */
async function generateQr({ reservation_id, expires_in = 600 }) {
  const qr_code = uuidv4();
  const url = `https://example.com/qr/${qr_code}`;
  const expires_at = dayjs().add(expires_in, 'second').toISOString();

  await pool.query(
    'INSERT INTO qr_codes (qr_id, reservation_id, expires_in, url) VALUES (?, ?, ?, ?)',
    [qr_code, reservation_id, expires_in, url]
  );

  // 📨 Gửi event sang RabbitMQ để các service khác biết có QR mới
  try {
    await publish('qr_events', {
      type: 'QR_GENERATED',
      timestamp: new Date().toISOString(),
      data: {
        qr_id: qr_code,
        reservation_id,
        url,
        expires_at,
      },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (QR_GENERATED):', e.message);
  }

  return { qr_code, url, expires_at, reservation_id };
}

/**
 * Xác thực QR trước khi bắt đầu phiên sạc
 * @param {string} qr_id
 */
async function validateQr(qr_id) {
  const [rows] = await pool.query('SELECT * FROM qr_codes WHERE qr_id = ?', [qr_id]);
  if (!rows || rows.length === 0) {
    return { valid: false };
  }

  const row = rows[0];
  // TODO: trong bản thực tế nên có `created_at` để so sánh với `expires_in`
  const isValid = true;

  // 📨 Gửi event xác thực QR sang RabbitMQ
  try {
    await publish('qr_events', {
      type: 'QR_VALIDATED',
      timestamp: new Date().toISOString(),
      data: {
        qr_id,
        reservation_id: row.reservation_id,
        valid: isValid,
      },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (QR_VALIDATED):', e.message);
  }

  return { valid: isValid, reservation_id: row.reservation_id };
}

module.exports = { generateQr, validateQr };
