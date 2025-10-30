const pool = require('../../db');
const Notification = require('../models/Notification');

class NotificationRepository {
  async create(notification) {
    await pool.query(
      `INSERT INTO notifications 
      (notification_id, to_user, channels, title, message, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.notification_id,
        notification.to_user,
        JSON.stringify(notification.channels || []),
        notification.title,
        notification.message,
        notification.status,
        JSON.stringify(notification.metadata || {})
      ]
    );
    return notification;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE notification_id = ?', [id]);
    return rows[0] ? Notification.fromRow(rows[0]) : null;
  }

  async findByUser(to_user, limit = 50) {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE to_user = ? ORDER BY created_at DESC LIMIT ?`,
      [to_user, limit]
    );
    return rows.map(r => Notification.fromRow(r));
  }

  async updateStatus(id, status) {
    await pool.query('UPDATE notifications SET status = ? WHERE notification_id = ?', [status, id]);
  }

  async delete(id) {
    await pool.query('DELETE FROM notifications WHERE notification_id = ?', [id]);
  }
}

module.exports = NotificationRepository;
