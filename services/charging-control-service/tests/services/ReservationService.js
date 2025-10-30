const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const Reservation = require('../models/Reservation');
const { publish } = require('../../rabbit');

class ReservationService {
  constructor(reservationRepo) {
    this.repo = reservationRepo;
  }

  async createReservation(data) {
    const now = dayjs();
    const expiresAt = now.add(15, 'minute').toDate();

    const reservation = new Reservation({
      reservation_id: uuidv4(),
      user_id: data.user_id,
      station_id: data.station_id,
      point_id: data.point_id,
      connector_type: data.connector_type || 'Type2',
      start_time: data.start_time || now.toDate(),
      end_time: data.end_time || null,
      status: 'pending',
      expires_at: expiresAt
    });

    await this.repo.create(reservation);

    // Gửi sự kiện RabbitMQ
    await publish('reservation_events', {
      type: 'RESERVATION_CREATED',
      data: reservation
    });

    return reservation;
  }

  async confirmReservation(reservation_id) {
    await this.repo.updateStatus(reservation_id, 'confirmed');
    await publish('reservation_events', {
      type: 'RESERVATION_CONFIRMED',
      reservation_id
    });
  }

  async cancelReservation(reservation_id) {
    await this.repo.updateStatus(reservation_id, 'cancelled');
    await publish('reservation_events', {
      type: 'RESERVATION_CANCELLED',
      reservation_id
    });
  }

  async getByUser(user_id) {
    return this.repo.findByUser(user_id);
  }

  async getById(id) {
    return this.repo.findById(id);
  }
}

module.exports = ReservationService;
