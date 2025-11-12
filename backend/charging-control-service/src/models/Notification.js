class Notification {
  constructor({
    notification_id,
    to_user,
    channels = ['push'],
    title,
    message,
    status = 'unread',
    metadata = {},
    created_at
  }) {
    this.notification_id = notification_id;
    this.to_user = to_user;
    this.channels = channels;
    this.title = title;
    this.message = message;
    this.status = status;
    this.metadata = metadata;
    this.created_at = created_at ? new Date(created_at) : new Date();
  }

  markAsRead() {
    this.status = 'read';
  }

  markAsSent() {
    this.status = 'sent';
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Notification;
