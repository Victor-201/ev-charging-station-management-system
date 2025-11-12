const NotificationRepo = require('../repositories/NotificationRepository');
const { publish } = require('../rabbit');

class NotificationService {
  async sendNotification(data) {
    const notification = await NotificationRepo.create(data);
    await publish('notification_events', { type: 'NOTIFICATION_SENT', data: notification });
    return notification;
  }

  async getUnread(user_id) {
    return NotificationRepo.findUnreadByUser(user_id);
  }

  async markAsRead(id) {
    await NotificationRepo.markAsRead(id);
  }
}

module.exports = new NotificationService();
