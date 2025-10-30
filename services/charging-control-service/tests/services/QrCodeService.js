const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const QrCode = require('../models/QrCode');
const { publish } = require('../../rabbit');

class QrCodeService {
  constructor(qrRepo) {
    this.repo = qrRepo;
  }

  async generateQr(reservation_id, user_id) {
    const qr = new QrCode({
      qr_id: uuidv4(),
      reservation_id,
      user_id,
      url: `https://ev.example.com/qr/${uuidv4()}`,
      expires_in: 300,
      status: 'active'
    });

    await this.repo.create(qr);
    await publish('qr_events', { type: 'QR_CREATED', data: qr });

    return qr;
  }

  async validateQr(qr_id) {
    const qr = await this.repo.findById(qr_id);
    if (!qr) throw new Error('QR not found');

    const expired = dayjs(qr.created_at).add(qr.expires_in, 'second').isBefore(dayjs());
    if (expired) {
      await this.repo.markUsed(qr_id);
      throw new Error('QR expired');
    }

    return qr;
  }

  async markUsed(qr_id) {
    await this.repo.markUsed(qr_id);
    await publish('qr_events', { type: 'QR_USED', qr_id });
  }

  async cleanupExpired() {
    await this.repo.deleteExpired();
  }
}

module.exports = QrCodeService;
