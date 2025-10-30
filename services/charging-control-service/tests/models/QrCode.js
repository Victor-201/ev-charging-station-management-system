class QrCode {
  constructor({
    qr_id,
    reservation_id,
    user_id,
    url,
    expires_in,
    status,
    created_at
  }) {
    this.qr_id = qr_id;
    this.reservation_id = reservation_id;
    this.user_id = user_id;
    this.url = url;
    this.expires_in = expires_in; // seconds
    this.status = status; // active | expired | used
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new QrCode({
      qr_id: row.qr_id,
      reservation_id: row.reservation_id,
      user_id: row.user_id,
      url: row.url,
      expires_in: row.expires_in,
      status: row.status,
      created_at: row.created_at
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = QrCode;
