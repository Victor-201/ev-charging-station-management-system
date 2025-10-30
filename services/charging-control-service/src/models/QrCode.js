class QrCode {
  constructor({
    qr_id,
    reservation_id,
    url,
    status = 'active',
    expires_in = 600, // giây
    created_at
  }) {
    this.qr_id = qr_id;
    this.reservation_id = reservation_id;
    this.url = url;
    this.status = status;
    this.expires_in = expires_in;
    this.created_at = created_at ? new Date(created_at) : new Date();
  }

  isExpired() {
    const expireTime = new Date(this.created_at.getTime() + this.expires_in * 1000);
    return new Date() > expireTime || this.status === 'used';
  }

  markUsed() {
    this.status = 'used';
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = QrCode;
