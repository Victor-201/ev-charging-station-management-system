class Notification {
  constructor({
    notification_id,
    to_user,
    channels,
    title,
    message,
    status,
    metadata,
    created_at
  }) {
    this.notification_id = notification_id;
    this.to_user = to_user;
    this.channels = channels; // e.g., ['email', 'push']
    this.title = title;
    this.message = message;
    this.status = status; // sent | delivered | read
    this.metadata = metadata;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Notification({
      notification_id: row.notification_id,
      to_user: row.to_user,
      channels: row.channels ? JSON.parse(row.channels) : [],
      title: row.title,
      message: row.message,
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      created_at: row.created_at
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Notification;
