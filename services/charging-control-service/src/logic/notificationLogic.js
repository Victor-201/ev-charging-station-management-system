const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const { publish } = require('../rabbit'); // 🔥 Thêm dòng này để dùng RabbitMQ

/**
 * Gửi thông báo đến người dùng
 * payload = {
 *   to_user: "U12345",
 *   channels: ["push", "email"],
 *   title: "Title",
 *   message: "Body",
 *   data: { optional custom data }
 * }
 */
async function sendNotification(payload) {
  const id = uuidv4();

  // 1️⃣ Lưu vào bảng notifications trong MySQL
  await pool.query(
    `INSERT INTO notifications (id, to_user, channels, title, message, status) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.to_user || null,
      JSON.stringify(payload.channels || []),
      payload.title || '',
      payload.message || '',
      'queued',
    ]
  );

  // 2️⃣ Gửi thông báo sang RabbitMQ để các worker xử lý gửi thật
  try {
    await publish('notification_events', {
      type: 'NOTIFICATION_QUEUED',
      timestamp: new Date().toISOString(),
      data: {
        id,
        to_user: payload.to_user,
        channels: payload.channels || [],
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
      },
    });
  } catch (err) {
    console.warn('⚠️ RabbitMQ publish failed (NOTIFICATION_QUEUED):', err.message);
  }

  return { status: 'queued', id };
}

/**
 * Hàm có thể mở rộng thêm sau này
 * để thay đổi trạng thái gửi (delivered, failed,...)
 */
async function updateNotificationStatus(id, status) {
  await pool.query('UPDATE notifications SET status = ? WHERE id = ?', [status, id]);
}

module.exports = { sendNotification, updateNotificationStatus };
