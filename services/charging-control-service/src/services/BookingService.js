const ReservationRepo = require('../repositories/ReservationRepository');
const WaitlistRepo = require('../repositories/WaitlistRepository');
const QrRepo = require('../repositories/QrCodeRepository');
const { publish } = require('../rabbit'); // RabbitMQ publisher (nếu có)
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const debug =
  typeof require('debug') === 'function'
    ? require('debug')('waitlist:service')
    : (...args) => console.log('[WaitlistService]', ...args);

// helper timeout cho publish
function withTimeout(promise, ms = 2000) {
  const t = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  return Promise.race([promise, t]);
}

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
async updateReservation(data) {
  try {
    console.log('[updateReservation] input data:', JSON.stringify(data));
    const rawId = data.reservation_id ?? data.id;
    if (!rawId) throw new Error('Missing reservation_id');
    const id = typeof rawId === 'string' ? rawId.trim() : rawId;
    const idForQuery = Number.isNaN(Number(id)) ? id : Number(id);

    console.log('[updateReservation] normalized id:', idForQuery);

    const reservation = await ReservationRepo.findById(idForQuery);
    console.log('[updateReservation] findById result:', reservation);
    if (!reservation) throw new Error(`Reservation not found (id=${JSON.stringify(idForQuery)})`);

    // --- NEW: robust datetime parsing + logs
    const now = dayjs.utc();
    const dbStart = reservation.start_time ? dayjs.utc(reservation.start_time) : null;
    const payloadStart = data.start_time ? dayjs.utc(data.start_time) : null;

    console.log('[updateReservation] now:', now.toISOString());
    console.log('[updateReservation] dbStart:', dbStart ? dbStart.toISOString() : null);
    console.log('[updateReservation] payloadStart:', payloadStart ? payloadStart.toISOString() : null);

    // Business rule: if reservation already started (dbStart < now)
    if (dbStart && dbStart.isBefore(now)) {
      // Allow reschedule IF client provided a new start_time in the future
      if (payloadStart && payloadStart.isAfter(now)) {
        console.log('[updateReservation] allowing reschedule because payloadStart > now');
        // allow: continue
      } else {
        // if no payloadStart provided, or payloadStart is not in future, block update
        throw new Error('Cannot update reservation that has already started (unless rescheduled to future start_time)');
      }
    }

    // apply updates
    Object.assign(reservation, {
      start_time: data.start_time ?? reservation.start_time,
      end_time: data.end_time ?? reservation.end_time,
      status: data.status ?? reservation.status,
    });

    const updated = await ReservationRepo.update(reservation);

    if (typeof publish !== 'undefined' && publish) {
      await publish('reservation_events', {
        type: 'RESERVATION_UPDATED',
        data: updated,
      });
    }

    return updated;
  } catch (e) {
    console.error('[updateReservation] error:', e && e.stack ? e.stack : e);
    throw e;
  }
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

  async getUserReservations(user_id) {
    if (!user_id) throw new Error('Missing user_id');

    // gọi repository để lấy dữ liệu
    const reservations = await ReservationRepo.findByUser(user_id);

    // xử lý thêm nếu cần, ví dụ: sort theo thời gian mới nhất
    const sorted = reservations.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    // format dữ liệu trả về
    return sorted.map(r => ({
      reservation_id: r.reservation_id,
      station_id: r.station_id,
      start_time: r.start_time,
      end_time: r.end_time,
      status: r.status,
    }));
  }
  /**
   * Add user to waitlist (if slot unavailable)
   */
  /**
   * Thêm người dùng vào hàng chờ
   */
 async addToWaitlist({ user_id, station_id, connector_type }) {
    if (!user_id) throw new Error('Missing user_id');
    if (!station_id) throw new Error('Missing station_id');
    if (!connector_type) throw new Error('Missing connector_type');

    debug('adding to waitlist', { user_id, station_id, connector_type });

    // Let repository handle transactional position assignment
    const entry = await WaitlistRepo.create({ user_id, station_id, connector_type, status: 'waiting' });

    // publish non-blocking (fire-and-forget) with timeout + catch
    if (typeof publish === 'function') {
      withTimeout(publish('waitlist_events', { type: 'WAITLIST_ADDED', data: entry }), 2000)
        .then(() => debug('published WAITLIST_ADDED', entry.waitlist_id))
        .catch(err => debug('publish WAITLIST_ADDED failed/timeout', err.message));
    }

    return entry;
  }

  async getWaitlistByStation(station_id) {
    if (!station_id) throw new Error('Missing station_id');
    return WaitlistRepo.findActiveByStation(station_id);
  }

  async updateStatus(waitlist_id, status) {
    if (!waitlist_id) throw new Error('Missing waitlist_id');
    if (!status) throw new Error('Missing status');

    const waitlist = await WaitlistRepo.findById(waitlist_id);
    if (!waitlist) throw new Error('Waitlist not found');

    waitlist.status = status;
    await WaitlistRepo.update(waitlist);

    if (typeof publish === 'function') {
      withTimeout(publish('waitlist_events', { type: 'WAITLIST_UPDATED', data: waitlist }), 2000)
        .catch(err => debug('publish WAITLIST_UPDATED failed', err.message));
    }

    return waitlist;
  }

  async removeFromWaitlist(waitlist_id) {
    if (!waitlist_id) throw new Error('Missing waitlist_id');

    const waitlist = await WaitlistRepo.findById(waitlist_id);
    if (!waitlist) throw new Error('Waitlist not found');

    await WaitlistRepo.delete(waitlist_id);

    // re-order remaining (simple approach)
    const remainings = await WaitlistRepo.findActiveByStation(waitlist.station_id);
    for (let i = 0; i < remainings.length; i++) {
      const w = remainings[i];
      if (w.position !== i + 1) {
        w.position = i + 1;
        await WaitlistRepo.update(w);
      }
    }

    if (typeof publish === 'function') {
      withTimeout(publish('waitlist_events', { type: 'WAITLIST_REMOVED', data: waitlist }), 2000)
        .catch(err => debug('publish WAITLIST_REMOVED failed', err.message));
    }

    return { success: true };
  }
  /**
   * Generate a QR code for an existing reservation
   */
  async createQr({ reservation_id, expires_in = 600 }) {
    if (!reservation_id || typeof reservation_id !== 'string') {
      const e = new Error('reservation_id is required and must be a string');
      e.status = 400;
      throw e;
    }

    // Sanitize & bounds for expires_in
    const expires = Number(expires_in) || 600;
    if (!Number.isFinite(expires) || expires <= 0 || expires > 86400) { // <= 24h cap
      const e = new Error('expires_in must be a positive number (max 86400)');
      e.status = 400;
      throw e;
    }

    // Tạo QR bằng repository
    const created = await QrRepo.create({ reservation_id, expires_in: expires });

    return {
      qr_code: created.qr_id,
      url: created.url,
      expires_at: created.expires_at, // optional useful info
    };
  }

  /**
   * Validate QR (wrapper)
   */
  async validateQr(qr_id) {
    if (!qr_id) {
      const e = new Error('qr_id is required');
      e.status = 400;
      throw e;
    }
    return QrRepo.validate(qr_id);
  }

  /**
   * Mark a QR used
   */
  async markUsed(qr_id) {
    if (!qr_id) {
      const e = new Error('qr_id is required');
      e.status = 400;
      throw e;
    }
    await QrRepo.markUsed(qr_id);
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
