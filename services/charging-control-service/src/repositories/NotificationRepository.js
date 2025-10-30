const pool = require('../config/db');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

class NotificationRepository {
  async create(data) {
    const n = new Notification({
      notification_id: data.notification_id || uuidv4(),
      ...data
    });
    await pool.query(
      `INSERT INTO notifications (notification_id, to_user, channels, title, message, status, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        n.notification_id,
        n.to_user,
        JSON.stringify(n.channels),
        n.title,
        n.message,
        n.status,
        JSON.stringify(n.metadata)
      ]
    );
    return n;
  }

  async findUnreadByUser(user_id) {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE to_user=? AND status="unread"',
      [user_id]
    );
    return rows.map(r => new Notification(r));
  }

  async markAsRead(notification_id) {
    await pool.query('UPDATE notifications SET status="read" WHERE notification_id=?', [notification_id]);
  }
}

module.exports = new NotificationRepository();
