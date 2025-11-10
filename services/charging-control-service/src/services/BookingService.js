// services/BookingService.js
const ReservationRepo = require('../repositories/ReservationRepository');
const WaitlistRepo = require('../repositories/WaitlistRepository');
const QrRepo = require('../repositories/QrCodeRepository');
const { publish } = require('../rabbit'); // RabbitMQ publisher (nếu có)
const dayjs = require('dayjs');
const pool = require('../config/db');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const debug =
  typeof require('debug') === 'function'
    ? require('debug')('booking:service')
    : (...args) => console.log('[BookingService]', ...args);

// helper timeout cho publish (non-blocking publish with limited wait)
function withTimeout(promise, ms = 2000) {
  const t = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  return Promise.race([promise, t]);
}

class BookingService {
  /**
   * Create new reservation
   * - By default tạo reservation với status 'pending' (chờ thanh toán).
   * - Nếu caller truyền status:'confirmed' => coi là đã thanh toán.
   * - expires_at nên được set (để auto-huỷ khi chưa thanh toán).
   */
  async createReservation(data) {
    const {
      user_id,
      station_id,
      point_id,
      connector_type,
      start_time,
      end_time,
      price_per_min,
      status // optional: 'pending' | 'confirmed' ...
    } = data;

    // Validate basic fields
    if (!user_id || !station_id || !point_id || !connector_type || !start_time || !end_time) {
      const e = new Error('Missing required reservation fields');
      e.status = 400;
      throw e;
    }

    // Check time range
    if (dayjs(end_time).isBefore(dayjs(start_time))) {
      const e = new Error('Invalid time range: end_time is before start_time');
      e.status = 400;
      throw e;
    }

    // If attempting to create confirmed reservation, ensure availability
    const available = await ReservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
    if (!available) {
      const e = new Error('Charging point is already reserved for this time slot');
      e.status = 409;
      throw e;
    }

    // Determine status: default pending (chờ thanh toán)
    const finalStatus = status || 'pending';

    // Set reasonable expires_at: if pending, expire a few minutes before start (or in X minutes)
    // Caller can override expires_at in data; otherwise default: start_time - 5 minutes for pending,
    // or null for confirmed.
    const expires_at = data.expires_at
      ? dayjs.utc(data.expires_at).toISOString()
      : (finalStatus === 'pending' ? dayjs.utc(start_time).subtract(5, 'minute').toISOString() : null);

    // Create reservation
    const reservation = await ReservationRepo.create({
      user_id,
      station_id,
      point_id,
      connector_type,
      start_time,
      end_time,
      status: finalStatus,
      price_per_min: typeof price_per_min === 'number' ? price_per_min : 1000,
      expires_at
    });

    // Publish event
    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_CREATED',
        data: reservation,
      }), 2000).catch(err => debug('publish RESERVATION_CREATED failed/timeout', err.message));
    }

    return reservation;
  }

  /**
   * Confirm a reservation after successful payment.
   * - Moves status from 'pending' -> 'confirmed'
   * - Validates availability again (race condition)
   */
  async confirmReservation(reservation_id, { payment_info = null } = {}) {
    if (!reservation_id) {
      const e = new Error('reservation_id is required');
      e.status = 400;
      throw e;
    }

    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) {
      const e = new Error('Reservation not found');
      e.status = 404;
      throw e;
    }

    if (reservation.status === 'confirmed') {
      return reservation;
    }

    if (reservation.status === 'cancelled' || reservation.status === 'completed' || reservation.status === 'expired') {
      const e = new Error(`Cannot confirm reservation in status ${reservation.status}`);
      e.status = 400;
      throw e;
    }

    // Re-check availability for the same time slot (avoid double-book)
    const available = await ReservationRepo.checkAvailability(reservation.station_id, reservation.point_id, reservation.start_time, reservation.end_time);
    if (!available) {
      // If not available, mark as cancelled and inform caller to refund
      await ReservationRepo.markCancelled(reservation_id);
      if (typeof publish === 'function') {
        withTimeout(publish('reservation_events', {
          type: 'RESERVATION_CONFIRM_FAILED',
          data: { reservation_id, reason: 'slot_unavailable' }
        }), 2000).catch(err => debug('publish RESERVATION_CONFIRM_FAILED failed', err.message));
      }
      const e = new Error('Slot no longer available; reservation cancelled');
      e.status = 409;
      throw e;
    }

    // Mark confirmed
    reservation.status = 'confirmed';
    // clear expires_at when confirmed (optional) so it won't auto-expire
    reservation.expires_at = null;
    const updated = await ReservationRepo.update(reservation);

    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_CONFIRMED',
        data: { reservation: updated, payment_info }
      }), 2000).catch(err => debug('publish RESERVATION_CONFIRMED failed', err.message));
    }

    return updated;
  }
    /**
   * Attach payment_id and confirm reservation if payment succeeded
   * - Only allowed when reservation is pending
   */
  async attachPaymentAndConfirm(reservation_id, payment_id) {
    if (!reservation_id || !payment_id) {
      const e = new Error('reservation_id and payment_id are required');
      e.status = 400;
      throw e;
    }

    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) {
      const e = new Error('Reservation not found');
      e.status = 404;
      throw e;
    }

    if (reservation.status !== 'pending') {
      const e = new Error(`Cannot attach payment to reservation in status ${reservation.status}`);
      e.status = 400;
      throw e;
    }

    // Check availability again just in case someone booked same slot
    const available = await ReservationRepo.checkAvailability(
      reservation.station_id,
      reservation.point_id,
      reservation.start_time,
      reservation.end_time
    );

    if (!available) {
      await ReservationRepo.markCancelled(reservation_id);
      if (typeof publish === 'function') {
        withTimeout(publish('reservation_events', {
          type: 'RESERVATION_CONFIRM_FAILED',
          data: { reservation_id, reason: 'slot_unavailable_after_payment' }
        }), 2000);
      }
      const e = new Error('Slot no longer available; auto-cancelled. Please refund user.');
      e.status = 409;
      throw e;
    }

    // OK: update reservation to confirmed + store payment_id
    reservation.payment_id = payment_id;
    reservation.status = 'confirmed';
    reservation.expires_at = null;
    const updated = await ReservationRepo.update(reservation);

    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_CONFIRMED',
        data: updated
      }), 2000);
    }

    return updated;
  }

  /**
   * Mark a reservation payment failed (and optionally cancel)
   */
  async markPaymentFailed(reservation_id, { cancel = true, reason = null } = {}) {
    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (cancel && reservation.status !== 'cancelled') {
      await ReservationRepo.markCancelled(reservation_id);
    }

    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_PAYMENT_FAILED',
        data: { reservation_id, cancel, reason }
      }), 2000).catch(err => debug('publish RESERVATION_PAYMENT_FAILED failed', err.message));
    }

    return { reservation_id, cancelled: cancel };
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(reservation_id) {
    if (!reservation_id) throw new Error('Missing reservation_id');
    return await ReservationRepo.findById(reservation_id);
  }

  /**
   * Update reservation (reschedule / change status)
   * - Contains business rule preventing updates after start unless rescheduling to future start_time
   */
  async updateReservation(data) {
    try {
      debug('[updateReservation] input data:', data);
      const rawId = data.reservation_id ?? data.id;
      if (!rawId) throw new Error('Missing reservation_id');
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;
      const idForQuery = Number.isNaN(Number(id)) ? id : Number(id);

      const reservation = await ReservationRepo.findById(idForQuery);
      if (!reservation) throw new Error(`Reservation not found (id=${JSON.stringify(idForQuery)})`);

      // robust datetime parsing
      const now = dayjs.utc();
      const dbStart = reservation.start_time ? dayjs.utc(reservation.start_time) : null;
      const payloadStart = data.start_time ? dayjs.utc(data.start_time) : null;

      // Business rule: if reservation already started (dbStart < now)
      if (dbStart && dbStart.isBefore(now)) {
        // Allow reschedule IF client provided a new start_time in the future
        if (payloadStart && payloadStart.isAfter(now)) {
          // allowed
        } else {
          throw new Error('Cannot update reservation that has already started (unless rescheduled to future start_time)');
        }
      }

      // If changing times and reservation is confirmed, re-check availability
      const newStart = data.start_time ?? reservation.start_time;
      const newEnd = data.end_time ?? reservation.end_time;
      if ((data.start_time || data.end_time) && reservation.status === 'confirmed') {
        const available = await ReservationRepo.checkAvailability(reservation.station_id, reservation.point_id, newStart, newEnd);
        if (!available) throw new Error('Charging point is already reserved for the new time slot');
      }

      // apply updates
      Object.assign(reservation, {
        start_time: data.start_time ?? reservation.start_time,
        end_time: data.end_time ?? reservation.end_time,
        status: data.status ?? reservation.status,
        price_per_min: typeof data.price_per_min === 'number' ? data.price_per_min : reservation.price_per_min,
        // allow explicit expires_at update
        expires_at: data.expires_at ?? reservation.expires_at,
      });

      const updated = await ReservationRepo.update(reservation);

      if (typeof publish === 'function') {
        withTimeout(publish('reservation_events', {
          type: 'RESERVATION_UPDATED',
          data: updated,
        }), 2000).catch(err => debug('publish RESERVATION_UPDATED failed', err.message));
      }

      return updated;
    } catch (e) {
      debug('[updateReservation] error:', e && e.stack ? e.stack : e);
      throw e;
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservation_id, { reason = null } = {}) {
    if (!reservation_id) throw new Error('Missing reservation_id');
    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (reservation.status === 'cancelled') {
      return { message: 'Already cancelled' };
    }

    await ReservationRepo.markCancelled(reservation_id);

    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_CANCELLED',
        data: { reservation_id, reason }
      }), 2000).catch(err => debug('publish RESERVATION_CANCELLED failed', err.message));
    }

    return { message: 'Reservation cancelled successfully' };
  }

  /**
   * Auto-cancel expired pending reservations:
   * - Cancel reservations where status='pending' and expires_at < now
   * - Publish event with list of cancelled ids
   */
  async expirePendingReservations() {
    const threshold = dayjs.utc().format('YYYY-MM-DD HH:mm:ss');

    // get pending and expired
    const [rows] = await ReservationRepo && ReservationRepo._getPool
      ? await ReservationRepo._getPool().query( // defensive: if repo exposes pool
          `SELECT reservation_id FROM reservations WHERE status='pending' AND expires_at IS NOT NULL AND expires_at < ?`,
          [threshold]
        )
      : null;

    // If repository didn't expose pool, fallback to using repo method (if any).
    // But since our ReservationRepo doesn't have direct list method, use generic query via repo if available.
    let ids = [];
    try {
      if (rows && rows.length) ids = rows.map(r => r.reservation_id);
    } catch (e) {
      // fallback: simple approach - call autoCancelExpired (which earlier cancels 'confirmed' with start_time < threshold)
      debug('expirePendingReservations: fallback path');
    }

    // If we have ids, update them
    if (ids.length) {
      await ReservationRepo.updateManyStatus(ids, 'cancelled').catch(async (err) => {
        // if no updateManyStatus, loop
        debug('updateManyStatus missing or failed, falling back to markCancelled loop', err.message || err);
        for (const id of ids) {
          try { await ReservationRepo.markCancelled(id); } catch (e2) { debug('markCancelled failed', id, e2.message || e2); }
        }
      });

      if (typeof publish === 'function') {
        withTimeout(publish('reservation_events', {
          type: 'RESERVATION_PENDING_EXPIRED',
          data: ids,
        }), 2000).catch(err => debug('publish RESERVATION_PENDING_EXPIRED failed', err.message));
      }
    }

    return ids;
  }

  /**
   * Get all reservations of a user (formatted)
   */
  async getUserReservations(user_id) {
    if (!user_id) throw new Error('Missing user_id');

    const reservations = await ReservationRepo.findByUser(user_id);
    const sorted = reservations.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    return sorted.map(r => ({
      reservation_id: r.reservation_id,
      station_id: r.station_id,
      point_id: r.point_id,
      connector_type: r.connector_type,
      start_time: r.start_time,
      end_time: r.end_time,
      status: r.status,
      price_per_min: r.price_per_min,
      reserved_minutes: r.reserved_minutes,
      total_cost: r.total_cost
    }));
  }

  /**
   * Waitlist helpers
   */
  async addToWaitlist({ user_id, station_id, connector_type }) {
    if (!user_id) throw new Error('Missing user_id');
    if (!station_id) throw new Error('Missing station_id');
    if (!connector_type) throw new Error('Missing connector_type');

    debug('adding to waitlist', { user_id, station_id, connector_type });

    const entry = await WaitlistRepo.create({ user_id, station_id, connector_type, status: 'waiting' });

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

  async updateWaitlistStatus(waitlist_id, status) {
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
   * QR helpers
   */
  async createQr({ reservation_id, expires_in = 600 }) {
    if (!reservation_id || typeof reservation_id !== 'string') {
      const e = new Error('reservation_id is required and must be a string');
      e.status = 400;
      throw e;
    }

    const expires = Number(expires_in) || 600;
    if (!Number.isFinite(expires) || expires <= 0 || expires > 86400) {
      const e = new Error('expires_in must be a positive number (max 86400)');
      e.status = 400;
      throw e;
    }

    const created = await QrRepo.create({ reservation_id, expires_in: expires });

    return {
      qr_code: created.qr_id,
      url: created.url,
      expires_at: created.expires_at,
    };
  }

  async validateQr(qr_id) {
    if (!qr_id) {
      const e = new Error('qr_id is required');
      e.status = 400;
      throw e;
    }
    return QrRepo.validate(qr_id);
  }

  async markUsed(qr_id) {
    if (!qr_id) {
      const e = new Error('qr_id is required');
      e.status = 400;
      throw e;
    }
    await QrRepo.markUsed(qr_id);
  }

  //
  // Pricing / Cost helpers
  //

  async previewReserrvationCost(reservation_id, { roundUp = true } = {}) {
    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (!reservation.start_time) throw new Error('Reservation has no start_time');
    const end = reservation.end_time ? dayjs.utc(reservation.end_time) : dayjs.utc();
    const start = dayjs.utc(reservation.start_time);
    if (end.isBefore(start)) throw new Error('Invalid reservation times');

    const diffMs = end.diff(start);
    const minutes = diffMs <= 0 ? 0 : (roundUp ? Math.ceil(diffMs / 60000) : Math.floor(diffMs / 60000));
    const pricePerMin = typeof reservation.price_per_min === 'number' ? reservation.price_per_min : 1000;
    const total = minutes * pricePerMin;

    return { minutes, total, price_per_min: pricePerMin };
  }

  async calculateReservationCost(reservation_id, { roundUp = true, payment_method = null } = {}) {
  if (!reservation_id) throw new Error('reservation_id is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock reservation
    const [resRows] = await conn.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1 FOR UPDATE', [reservation_id]);
    if (!resRows || !resRows.length) throw new Error('Reservation not found');
    const reservation = resRows[0];

    if (!reservation.start_time) throw new Error('Reservation has no start_time');

    // compute minutes & total (UTC)
    const end = reservation.end_time ? dayjs.utc(reservation.end_time) : dayjs.utc();
    const start = dayjs.utc(reservation.start_time);
    const diffMs = end.diff(start);
    const minutes = diffMs <= 0 ? 0 : (roundUp ? Math.ceil(diffMs / 60000) : Math.floor(diffMs / 60000));
    const pricePerMin = Number(reservation.price_per_min || 1000);
    const total = minutes * pricePerMin;

    // update reservation reserved_minutes & total_cost & maybe payment_method
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
    const newPaymentMethod = (payment_method && ['wallet','bank_transfer'].includes(payment_method)) ? payment_method : reservation.payment_method;

    await conn.query(
      `UPDATE reservations SET reserved_minutes = ?, total_cost = ?, payment_method = ?, updated_at = ? WHERE reservation_id = ?`,
      [minutes, total, newPaymentMethod, now, reservation_id]
    );

    // If there's a session linked, update its metadata with reservation snapshot (merge)
    const [sessRows] = await conn.query('SELECT * FROM sessions WHERE reservation_id = ? LIMIT 1 FOR UPDATE', [reservation_id]);
    if (sessRows && sessRows.length) {
      const s = sessRows[0];
      let meta = {};
      try { meta = s.metadata ? (typeof s.metadata === 'object' ? s.metadata : JSON.parse(s.metadata)) : {}; } catch(e) { meta = {}; }

      meta.reservation_snapshot = {
        reservation_id,
        reserved_minutes: minutes,
        reserved_total: total,
        price_per_min: pricePerMin,
        computed_at: now,
        payment_method: newPaymentMethod
      };

      await conn.query('UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?', [
        JSON.stringify(meta),
        now,
        s.session_id
      ]);
    }

    await conn.commit();
    return { reservation_id, minutes, total, payment_method: newPaymentMethod };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  }



  /**
   * Finalize a reservation: set end_time (if provided), set status 'completed',
   * calculate cost (persist) and return summary with adjustment (charge/ refund)
   */
  async finalizeReservation(reservation_id, { end_time = null, roundUp = true } = {}) {
    if (!reservation_id) throw new Error('Missing reservation_id');

    const reservation = await ReservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    const previousTotal = typeof reservation.total_cost === 'number' ? reservation.total_cost : (reservation.total_cost ? Number(reservation.total_cost) : 0);

    const end = end_time ? dayjs.utc(end_time) : dayjs.utc();

    if (!reservation.start_time) throw new Error('Reservation has no start_time');

    const start = dayjs.utc(reservation.start_time);
    if (end.isBefore(start)) throw new Error('end_time is before start_time');

    // Update end_time & status
    reservation.end_time = end.toISOString();
    reservation.status = 'completed';

    await ReservationRepo.update(reservation);

    const calc = await this.calculateReservationCost(reservation_id, { roundUp });
    const newTotal = typeof calc.total === 'number' ? calc.total : Number(calc.total || 0);
    const minutes = calc.minutes;

    // determine adjustment
    let action = 'none';
    let diff = 0;
    let message = 'No adjustment necessary';

    if (newTotal > previousTotal) {
      action = 'charge_extra';
      diff = newTotal - previousTotal;
      message = `Khách hàng cần trả thêm ${diff} VND (chênh lệch giữa phí thực tế và phí đã đặt).`;
    } else if (newTotal < previousTotal) {
      action = 'refund';
      diff = previousTotal - newTotal;
      message = `Hoàn tiền ${diff} VND cho khách (phí thực tế nhỏ hơn phí đã đặt).`;
    }

    const result = {
      reservation_id,
      minutes,
      previous_total: previousTotal,
      new_total: newTotal,
      difference: diff,
      action,
      message
    };

    if (typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_PAYMENT_ADJUSTMENT',
        data: result,
      }), 2000).catch(err => debug('publish RESERVATION_PAYMENT_ADJUSTMENT failed', err.message));
    }

    return result;
  }

  //
  // Convenience: wrapper for availability check
  //
  async checkAvailability(station_id, point_id, start_time, end_time) {
    if (!station_id || !point_id || !start_time || !end_time) throw new Error('Missing availability parameters');
    return await ReservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
  }

  //
  // Cron / housekeeping helpers
  //
  async autoCancelExpiredReservations() {
    const cancelled = await ReservationRepo.autoCancelExpired(20);

    if (cancelled.length && typeof publish === 'function') {
      withTimeout(publish('reservation_events', {
        type: 'RESERVATION_AUTO_CANCELLED',
        data: cancelled,
      }), 2000).catch(err => debug('publish RESERVATION_AUTO_CANCELLED failed', err.message));
    }

    return cancelled;
  }
}

module.exports = new BookingService();
