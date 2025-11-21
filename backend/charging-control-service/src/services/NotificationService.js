const NotificationRepo = require('../repositories/NotificationRepository');
const { publishEvent  } = require('../core/rabbit/publisher.js');

class NotificationService {
  async sendNotification(data) {
    const notification = await NotificationRepo.create(data);
    publishEvent ('notification_events', { type: 'NOTIFICATION_SENT', data: notification });
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
