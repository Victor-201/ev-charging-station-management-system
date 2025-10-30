const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const { publish } = require('../../rabbit');

class NotificationService {
  constructor(notificationRepo) {
    this.repo = notificationRepo;
  }

  async sendNotification(data) {
    const notification = new Notification({
      notification_id: uuidv4(),
      to_user: data.to_user,
      channels: data.channels || ['push'],
      title: data.title,
      message: data.message,
      status: 'unread',
      metadata: data.metadata || {}
    });

    await this.repo.create(notification);

    await publish('notification_events', {
      type: 'NOTIFICATION_CREATED',
      data: notification
    });

    return notification;
  }

  async markAsRead(notification_id) {
    await this.repo.updateStatus(notification_id, 'read');
  }

  async getUserNotifications(to_user) {
    return this.repo.findByUser(to_user);
  }
}

module.exports = NotificationService;
