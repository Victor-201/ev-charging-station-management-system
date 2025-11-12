const ReservationRepo = require('../repositories/ReservationRepository');
const EventOutboxRepo = require('../repositories/EventOutboxRepository');
const WaitlistRepo = require('../repositories/WaitlistRepository');
const QrRepo = require('../repositories/QrCodeRepository');
const { publish } = require('../rabbit');
const pool = require('../config/db');
const EventOutbox = require('../models/EventOutbox');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const debug = (...args) => console.log('[BookingService]', ...args);

function withTimeout(promise, ms = 2000) {
  const t = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  return Promise.race([promise, t]);
}

class BookingService {
  constructor() {
    this.reservationRepo = ReservationRepo;
    this.eventOutboxRepo = new EventOutboxRepo(pool);
    this.waitlistRepo = WaitlistRepo;
    this.qrRepo = QrRepo;
    this.publish = typeof publish === 'function' ? publish : () => {};
  }

  async createReservation(data) {
    const {
      user_id,
      station_id,
      point_id,
      connector_type,
      start_time,
      end_time,
      price_per_min,
      status
    } = data;

    if (!user_id || !station_id || !point_id || !connector_type || !start_time || !end_time) {
      const e = new Error('Missing required reservation fields');
      e.status = 400;
      throw e;
    }

    if (dayjs(end_time).isBefore(dayjs(start_time))) {
      const e = new Error('Invalid time range: end_time is before start_time');
      e.status = 400;
      throw e;
    }

    const available = await this.reservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
    if (!available) {
      const e = new Error('Charging point is already reserved for this time slot');
      e.status = 409;
      throw e;
    }

    const finalStatus = status || 'pending';
    const expires_at = data.expires_at
      ? dayjs.utc(data.expires_at).toISOString()
      : finalStatus === 'pending' ? dayjs.utc(start_time).subtract(5, 'minute').toISOString() : null;

    // Tạo reservation
    const reservation = await this.reservationRepo.create({
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

    // ====== Outbox Event Booking ======
    const bookingEvent = new EventOutbox({
      id: uuidv4(),
      aggregate_type: 'reservation',
      aggregate_id: reservation.reservation_id,
      type: 'RESERVATION_CREATED',
      payload: reservation
    });

    await this.eventOutboxRepo.create(bookingEvent);
    debug(`[Outbox] RESERVATION_CREATED saved id=${bookingEvent.id}`);

    // Publish booking event
    withTimeout(this.publish('reservation_events', reservation))
      .then(async () => {
        debug(`[RabbitMQ] RESERVATION_CREATED published id=${bookingEvent.id}`);
        await this.eventOutboxRepo.markProcessed(bookingEvent.id);
      })
      .catch(err => debug('[RabbitMQ] publish failed/timeout', err.message));

    // ====== Payment Event ======
    if (finalStatus === 'pending') {
      const paymentPayload = {
        reservation_id: reservation.reservation_id,
        user_id,
        amount: reservation.price_per_min * dayjs(reservation.end_time).diff(dayjs(reservation.start_time), 'minute'),
        currency: 'VND',
        expires_at: reservation.expires_at
      };

      const paymentEvent = new EventOutbox({
        id: uuidv4(),
        aggregate_type: 'reservation',
        aggregate_id: reservation.reservation_id,
        type: 'RESERVATION_PAYMENT_PENDING',
        payload: paymentPayload
      });

      await this.eventOutboxRepo.create(paymentEvent);
      debug(`[Outbox] RESERVATION_PAYMENT_PENDING saved id=${paymentEvent.id}`);

      withTimeout(this.publish('payment_events', paymentPayload))
        .then(async () => {
          debug(`[RabbitMQ] RESERVATION_PAYMENT_PENDING published id=${paymentEvent.id}`);
          await this.eventOutboxRepo.markProcessed(paymentEvent.id);
        })
        .catch(err => debug('[RabbitMQ] publish to PaymentService failed/timeout', err.message));
    }

    return reservation;
  }



  async confirmReservation(reservation_id, { payment_info = null } = {}) {
    if (!reservation_id) throw new Error('reservation_id is required');

    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (reservation.status === 'confirmed') return reservation;
    if (['cancelled', 'completed', 'expired'].includes(reservation.status)) {
      const e = new Error(`Cannot confirm reservation in status ${reservation.status}`);
      e.status = 400;
      throw e;
    }

    const available = await this.reservationRepo.checkAvailability(
      reservation.station_id,
      reservation.point_id,
      reservation.start_time,
      reservation.end_time
    );

    if (!available) {
      await this.reservationRepo.markCancelled(reservation_id);
      withTimeout(this.publish('reservation_events', {
        type: 'RESERVATION_CONFIRM_FAILED',
        data: { reservation_id, reason: 'slot_unavailable' }
      })).catch(err => debug('publish RESERVATION_CONFIRM_FAILED failed', err.message));

      const e = new Error('Slot no longer available; reservation cancelled');
      e.status = 409;
      throw e;
    }

    reservation.status = 'confirmed';
    reservation.expires_at = null;
    const updated = await this.reservationRepo.update(reservation);

    withTimeout(this.publish('reservation_events', {
      type: 'RESERVATION_CONFIRMED',
      data: { reservation: updated, payment_info }
    })).catch(err => debug('publish RESERVATION_CONFIRMED failed', err.message));

    return updated;
  }


  async markPaymentFailed(reservation_id, { cancel = true, reason = null } = {}) {
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (cancel && reservation.status !== 'cancelled') {
      await this.reservationRepo.markCancelled(reservation_id);
    }

    withTimeout(this.publish('reservation_events', {
      type: 'RESERVATION_PAYMENT_FAILED',
      data: { reservation_id, cancel, reason }
    })).catch(err => debug('publish RESERVATION_PAYMENT_FAILED failed', err.message));

    return { reservation_id, cancelled: cancel };
  }

  async getReservationById(reservation_id) {
    if (!reservation_id) throw new Error('Missing reservation_id');
    return await this.reservationRepo.findById(reservation_id);
  }

  async updateReservation(data) {
    try {
      debug('[updateReservation] input data:', data);
      const rawId = data.reservation_id ?? data.id;
      if (!rawId) throw new Error('Missing reservation_id');
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;
      const idForQuery = Number.isNaN(Number(id)) ? id : Number(id);

      const reservation = await this.reservationRepo.findById(idForQuery);
      if (!reservation) throw new Error(`Reservation not found (id=${idForQuery})`);

      const now = dayjs.utc();
      const dbStart = reservation.start_time ? dayjs.utc(reservation.start_time) : null;
      const payloadStart = data.start_time ? dayjs.utc(data.start_time) : null;

      if (dbStart && dbStart.isBefore(now)) {
        if (!payloadStart || !payloadStart.isAfter(now)) {
          throw new Error('Cannot update reservation that has already started (unless rescheduled to future start_time)');
        }
      }

      const newStart = data.start_time ?? reservation.start_time;
      const newEnd = data.end_time ?? reservation.end_time;
      if ((data.start_time || data.end_time) && reservation.status === 'confirmed') {
        const available = await this.reservationRepo.checkAvailability(reservation.station_id, reservation.point_id, newStart, newEnd);
        if (!available) throw new Error('Charging point is already reserved for the new time slot');
      }

      Object.assign(reservation, {
        start_time: data.start_time ?? reservation.start_time,
        end_time: data.end_time ?? reservation.end_time,
        status: data.status ?? reservation.status,
        price_per_min: typeof data.price_per_min === 'number' ? data.price_per_min : reservation.price_per_min,
        expires_at: data.expires_at ?? reservation.expires_at
      });

      const updated = await this.reservationRepo.update(reservation);

      withTimeout(this.publish('reservation_events', {
        type: 'RESERVATION_UPDATED',
        data: updated
      })).catch(err => debug('publish RESERVATION_UPDATED failed', err.message));

      return updated;
    } catch (e) {
      debug('[updateReservation] error:', e && e.stack ? e.stack : e);
      throw e;
    }
  }

  async cancelReservation(reservation_id, { reason = null } = {}) {
    if (!reservation_id) throw new Error('Missing reservation_id');
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (reservation.status === 'cancelled') return { message: 'Already cancelled' };

    await this.reservationRepo.markCancelled(reservation_id);

    withTimeout(this.publish('reservation_events', {
      type: 'RESERVATION_CANCELLED',
      data: { reservation_id, reason }
    })).catch(err => debug('publish RESERVATION_CANCELLED failed', err.message));

    return { message: 'Reservation cancelled successfully' };
  }

  async expirePendingReservations() {
    const threshold = dayjs.utc().format('YYYY-MM-DD HH:mm:ss');

    const [rows] = await this.reservationRepo && this.reservationRepo._getPool
      ? await this.reservationRepo._getPool().query(
          `SELECT reservation_id FROM reservations WHERE status='pending' AND expires_at IS NOT NULL AND expires_at < ?`,
          [threshold]
        )
      : [ ];

    let ids = [];
    if (rows && rows.length) ids = rows.map(r => r.reservation_id);

    if (ids.length) {
      await this.reservationRepo.updateManyStatus(ids, 'cancelled').catch(async (err) => {
        debug('updateManyStatus missing or failed, fallback loop', err.message);
        for (const id of ids) {
          try { await this.reservationRepo.markCancelled(id); } catch (e2) { debug('markCancelled failed', id, e2.message); }
        }
      });

      withTimeout(this.publish('reservation_events', {
        type: 'RESERVATION_PENDING_EXPIRED',
        data: ids
      })).catch(err => debug('publish RESERVATION_PENDING_EXPIRED failed', err.message));
    }

    return ids;
  }

  async getUserReservations(user_id) {
    if (!user_id) throw new Error('Missing user_id');

    const reservations = await this.reservationRepo.findByUser(user_id);
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

  // ================= Waitlist =================

  async addToWaitlist({ user_id, station_id, connector_type }) {
    if (!user_id || !station_id || !connector_type) throw new Error('Missing waitlist fields');

    const entry = await this.waitlistRepo.create({ user_id, station_id, connector_type, status: 'waiting' });

    withTimeout(this.publish('waitlist_events', { type: 'WAITLIST_ADDED', data: entry }))
      .then(() => debug('published WAITLIST_ADDED', entry.waitlist_id))
      .catch(err => debug('publish WAITLIST_ADDED failed', err.message));

    return entry;
  }

  async getWaitlistByStation(station_id) {
    if (!station_id) throw new Error('Missing station_id');
    return this.waitlistRepo.findActiveByStation(station_id);
  }

  async updateWaitlistStatus(waitlist_id, status) {
    if (!waitlist_id || !status) throw new Error('Missing waitlist_id or status');

    const waitlist = await this.waitlistRepo.findById(waitlist_id);
    if (!waitlist) throw new Error('Waitlist not found');

    waitlist.status = status;
    await this.waitlistRepo.update(waitlist);

    withTimeout(this.publish('waitlist_events', { type: 'WAITLIST_UPDATED', data: waitlist }))
      .catch(err => debug('publish WAITLIST_UPDATED failed', err.message));

    return waitlist;
  }

  async removeFromWaitlist(waitlist_id) {
    if (!waitlist_id) throw new Error('Missing waitlist_id');

    const waitlist = await this.waitlistRepo.findById(waitlist_id);
    if (!waitlist) throw new Error('Waitlist not found');

    await this.waitlistRepo.delete(waitlist_id);

    const remainings = await this.waitlistRepo.findActiveByStation(waitlist.station_id);
    for (let i = 0; i < remainings.length; i++) {
      const w = remainings[i];
      if (w.position !== i + 1) {
        w.position = i + 1;
        await this.waitlistRepo.update(w);
      }
    }

    withTimeout(this.publish('waitlist_events', { type: 'WAITLIST_REMOVED', data: waitlist }))
      .catch(err => debug('publish WAITLIST_REMOVED failed', err.message));

    return { success: true };
  }

  // ================= QR =================

  async createQr({ reservation_id, expires_in = 600 }) {
    if (!reservation_id || typeof reservation_id !== 'string') throw new Error('reservation_id required');

    const expires = Number(expires_in) || 600;
    if (!Number.isFinite(expires) || expires <= 0 || expires > 86400) throw new Error('expires_in invalid');

    const created = await this.qrRepo.create({ reservation_id, expires_in: expires });

    return {
      qr_code: created.qr_id,
      url: created.url,
      expires_at: created.expires_at
    };
  }

async validateQr(qr_id) {
  if (!qr_id) throw new Error('qr_id required');

  // fallback nếu this.qrRepo undefined
  if (!this.qrRepo) {
    console.log('[BookingService.validateQr] this.qrRepo undefined, fallback');
    const fallbackQrRepo = require('../repositories/QrCodeRepository');
    this.qrRepo = fallbackQrRepo;
  }

  const qrCheck = await this.qrRepo.validate(qr_id);

  if (!qrCheck || qrCheck.valid === false) {
    console.log('[BookingService.validateQr] QR invalid');
    return { valid: false };
  }

  console.log('[BookingService.validateQr] QR valid, reservation_id=', qrCheck.reservation_id);
  return {
    valid: true,
    reservation_id: qrCheck.reservation_id,
  };
}


  async markUsed(qr_id) {
    if (!qr_id) throw new Error('qr_id required');
    await this.qrRepo.markUsed(qr_id);
  }

  // ================= Cost =================

  async previewReserrvationCost(reservation_id, { roundUp = true } = {}) {
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');
    if (!reservation.start_time) throw new Error('Reservation has no start_time');

    const end = reservation.end_time ? dayjs.utc(reservation.end_time) : dayjs.utc();
    const start = dayjs.utc(reservation.start_time);
    if (end.isBefore(start)) throw new Error('Invalid reservation times');

    const diffMs = end.diff(start);
    const minutes = diffMs <= 0 ? 0 : (roundUp ? Math.ceil(diffMs / 60000) : Math.floor(diffMs / 60000));
    const pricePerMin = Number(reservation.price_per_min || 1000);
    const total = minutes * pricePerMin;

    return { minutes, total, price_per_min: pricePerMin };
  }

  async calculateReservationCost(reservation_id, { roundUp = true, payment_method = null } = {}) {
    if (!reservation_id) throw new Error('reservation_id required');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [resRows] = await conn.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1 FOR UPDATE', [reservation_id]);
      if (!resRows.length) throw new Error('Reservation not found');
      const reservation = resRows[0];

      const end = reservation.end_time ? dayjs.utc(reservation.end_time) : dayjs.utc();
      const start = dayjs.utc(reservation.start_time);
      const diffMs = end.diff(start);
      const minutes = diffMs <= 0 ? 0 : (roundUp ? Math.ceil(diffMs / 60000) : Math.floor(diffMs / 60000));
      const pricePerMin = Number(reservation.price_per_min || 1000);
      const total = minutes * pricePerMin;

      const now = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
      const newPaymentMethod = (payment_method && ['wallet','bank_transfer'].includes(payment_method)) ? payment_method : reservation.payment_method;

      await conn.query(
        `UPDATE reservations SET reserved_minutes = ?, total_cost = ?, payment_method = ?, updated_at = ? WHERE reservation_id = ?`,
        [minutes, total, newPaymentMethod, now, reservation_id]
      );

      const [sessRows] = await conn.query('SELECT * FROM sessions WHERE reservation_id = ? LIMIT 1 FOR UPDATE', [reservation_id]);
      if (sessRows.length) {
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

  async finalizeReservation(reservation_id, { end_time = null, roundUp = true } = {}) {
    if (!reservation_id) throw new Error('Missing reservation_id');

    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    const previousTotal = Number(reservation.total_cost || 0);
    const end = end_time ? dayjs.utc(end_time) : dayjs.utc();
    if (!reservation.start_time) throw new Error('Reservation has no start_time');

    const start = dayjs.utc(reservation.start_time);
    if (end.isBefore(start)) throw new Error('end_time is before start_time');

    reservation.end_time = end.toISOString();
    reservation.status = 'completed';
    await this.reservationRepo.update(reservation);

    const calc = await this.calculateReservationCost(reservation_id, { roundUp });
    const newTotal = Number(calc.total || 0);

    let action = 'none', diff = 0, message = 'No adjustment necessary';
    if (newTotal > previousTotal) {
      action = 'charge_extra'; diff = newTotal - previousTotal;
      message = `Khách hàng cần trả thêm ${diff} VND.`;
    } else if (newTotal < previousTotal) {
      action = 'refund'; diff = previousTotal - newTotal;
      message = `Hoàn tiền ${diff} VND cho khách.`;
    }

    const result = { reservation_id, minutes: calc.minutes, previous_total: previousTotal, new_total: newTotal, difference: diff, action, message };

    withTimeout(this.publish('reservation_events', { type: 'RESERVATION_PAYMENT_ADJUSTMENT', data: result }))
      .catch(err => debug('publish RESERVATION_PAYMENT_ADJUSTMENT failed', err.message));

    return result;
  }

  async checkAvailability(station_id, point_id, start_time, end_time) {
    if (!station_id || !point_id || !start_time || !end_time) throw new Error('Missing availability parameters');
    return await this.reservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
  }

  async autoCancelExpiredReservations() {
    const cancelled = await this.reservationRepo.autoCancelExpired(20);
    if (cancelled.length) {
      withTimeout(this.publish('reservation_events', { type: 'RESERVATION_AUTO_CANCELLED', data: cancelled }))
        .catch(err => debug('publish RESERVATION_AUTO_CANCELLED failed', err.message));
    }
    return cancelled;
  }
}

module.exports = new BookingService();
