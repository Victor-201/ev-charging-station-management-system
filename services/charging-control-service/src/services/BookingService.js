const ReservationRepo = require('../repositories/ReservationRepository');
// const WaitlistRepo = require('../repositories/WaitlistRepository');
const QrRepo = require('../repositories/QrCodeRepository');
const { publish } = require('../rabbit'); // RabbitMQ publisher (nếu có)
const dayjs = require('dayjs');

class BookingService {
  /**
   * Create new reservation
   */
  async createReservation(data) {
    const {
      user_id,
      station_id,
      point_id,
      connector_type,
      start_time,
      end_time,
    } = data;

    // Validate basic fields
    if (!user_id || !station_id || !point_id || !connector_type || !start_time || !end_time) {
      throw new Error('Missing required reservation fields');
    }

    // Check time range
    if (dayjs(end_time).isBefore(dayjs(start_time))) {
      throw new Error('Invalid time range');
    }

    // Check if slot is available
    const available = await ReservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
    if (!available) {
      throw new Error('Charging point is already reserved for this time slot');
    }

    // Create reservation
    const reservation = await ReservationRepo.create({
      user_id,
      station_id,
      point_id,
      connector_type,
      start_time,
      end_time,
      status: 'confirmed',
      expires_at: dayjs(start_time).subtract(5, 'minute').toISOString(),
    });

    // Optionally publish event (if RabbitMQ active)
    if (publish) {
      await publish('reservation_events', {
        type: 'RESERVATION_CREATED',
        data: reservation,
      });
    }

    return reservation;
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(reservation_id) {
    return await ReservationRepo.findById(reservation_id);
  }

  /**
   * Get all reservations of a user
   */
  async getUserReservations(user_id) {
    return await ReservationRepo.findByUser(user_id);
  }

  /**
   * Update reservation (time or status)
   */
  async updateReservation(data) {
    const reservation = await ReservationRepo.findById(data.reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    // Prevent update after start time
    if (dayjs(reservation.start_time).isBefore(dayjs())) {
      throw new Error('Cannot update reservation that has already started');
    }

    Object.assign(reservation, {
      start_time: data.start_time || reservation.start_time,
      end_time: data.end_time || reservation.end_time,
      status: data.status || reservation.status,
    });

    const updated = await ReservationRepo.update(reservation);

    if (publish) {
      await publish('reservation_events', {
        type: 'RESERVATION_UPDATED',
        data: updated,
      });
    }

    return updated;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservation_id) {
    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (reservation.status === 'cancelled') {
      return { message: 'Already cancelled' };
    }

    await ReservationRepo.markCancelled(reservation_id);

    if (publish) {
      await publish('reservation_events', {
        type: 'RESERVATION_CANCELLED',
        data: { reservation_id },
      });
    }

    return { message: 'Reservation cancelled successfully' };
  }

  /**
   * Add user to waitlist (if slot unavailable)
   */
  async addToWaitlist(data) {
    const { user_id, station_id, connector_type } = data;

    if (!user_id || !station_id || !connector_type) {
      throw new Error('Missing waitlist fields');
    }

    const entry = await WaitlistRepo.create({
      user_id,
      station_id,
      connector_type,
      status: 'waiting',
    });

    if (publish) {
      await publish('waitlist_events', {
        type: 'WAITLIST_ADDED',
        data: entry,
      });
    }

    return entry;
  }

  /**
   * Generate a QR code for an existing reservation
   */
  async generateQr(data) {
    const { reservation_id, user_id } = data;

    if (!reservation_id || !user_id) {
      throw new Error('Missing reservation_id or user_id');
    }

    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    // Generate QR valid for 10 minutes (default)
    const qr = await QrRepo.create({ reservation_id, user_id, expires_in: 600 });

    if (publish) {
      await publish('qr_events', {
        type: 'QR_CREATED',
        data: qr,
      });
    }

    return qr;
  }

  /**
   * Validate QR code
   */
  async validateQr(qr_id) {
    const { valid, reservation_id } = await QrRepo.validate(qr_id);

    if (!valid) throw new Error('QR invalid or expired');

    // Mark as used after validation
    await QrRepo.markUsed(qr_id);

    if (publish) {
      await publish('qr_events', {
        type: 'QR_USED',
        data: { qr_id, reservation_id },
      });
    }

    return { valid: true, reservation_id };
  }

  /**
   * Run auto-cancel expired reservations (used in cronjob)
   */
  async autoCancelExpiredReservations() {
    const cancelled = await ReservationRepo.autoCancelExpired(20);

    if (cancelled.length && publish) {
      await publish('reservation_events', {
        type: 'RESERVATION_AUTO_CANCELLED',
        data: cancelled,
      });
    }

    return cancelled;
  }

  /**
   * Check availability of a point
   */
  async checkAvailability(station_id, point_id, start_time, end_time) {
    return await ReservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
  }
}

module.exports = new BookingService();
