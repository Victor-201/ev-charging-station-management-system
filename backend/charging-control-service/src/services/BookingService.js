const ReservationRepo = require('../repositories/ReservationRepository');
const EventOutboxRepo = require('../repositories/EventOutboxRepository');
const WaitlistRepo = require('../repositories/WaitlistRepository');
const QrRepo = require('../repositories/QrCodeRepository');
const EventBus = require('../core/EventBus');
const pool = require('../config/db');
const EventOutbox = require('../models/EventOutbox');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const axios = require('axios');
const config = require('../config/env.js');
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

    this._subscribePaymentEvents();
  }

  _subscribePaymentEvents() {
    EventBus.subscribe('payment.booking.succeeded', async (payload) => {
      debug('💰 Payment succeeded:', payload.related_id);
      try {
        await this.confirmReservation(payload.related_id, { payment_info: payload });
      } catch (e) {
        debug('confirmReservation error:', e.message);
      }
    });

    EventBus.subscribe('payment.booking.failed', async (payload) => {
      debug('💸 Payment failed:', payload.related_id);
      try {
        await this.markReservationFailed(payload.related_id, { cancel: true, reason: payload.reason });
      } catch (e) {
        debug('markReservationFailed error:', e.message);
      }
    });
  }
async createReservation(data, token) {
  const {
    user_id,
    station_id,
    point_id,       // <-- chính là charger_id từ FE
    connector_type,
    start_time,
    end_time,
    status,
    payment_method
  } = data;

  // ===== VALIDATION =====
  if (!user_id || !station_id || !point_id || !connector_type || !start_time || !end_time) {
    const e = new Error('Missing required reservation fields');
    e.status = 400;
    throw e;
  }

  if (!['wallet', 'bank_transfer'].includes(payment_method)) {
    const e = new Error('Invalid payment_method');
    e.status = 400;
    throw e;
  }

  if (dayjs(end_time).isBefore(dayjs(start_time))) {
    const e = new Error('Invalid time range');
    e.status = 400;
    throw e;
  }

  // ===== CHECK AVAILABILITY =====
  const available = await this.reservationRepo.checkAvailability(
    station_id,
    point_id,
    start_time,
    end_time
  );

  if (!available) {
    const e = new Error('Charging point is already reserved');
    e.status = 409;
    throw e;
  }

  // ===== GET PRICING DIRECTLY USING point_id AS CHARGER_ID =====
  let pricingList = [];
  try {
    const res = await axios.get(
      `${config.STATIONBASE}/api/v1/chargers/${point_id}/pricing`,
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );

    console.log('đâsdsadada', res.data?.pricing)
    pricingList = res.data?.pricing || [];
  } catch (err) {
    console.error("Pricing API error:", err.response?.data || err);
    const e = new Error("Failed to fetch pricing for charger");
    e.status = 500;
    throw e;
  }

  // ===== FIND per_minute MODEL =====
  const perMin = pricingList.find((p) => p.model === "per_minute");

  if (!perMin) {
    const e = new Error("per_minute pricing model not found");
    e.status = 400;
    throw e;
  }

  const price_per_min = Number(perMin.price);

  // ===== CALCULATE TOTAL MINUTES =====
  const minutes = dayjs(end_time).diff(dayjs(start_time), "minute");

  // ===== CALCULATE TOTAL AMOUNT =====
  const total_amount = minutes * price_per_min;

  console.log("⏱ Minutes:", minutes);
  console.log("💵 Price per min:", price_per_min);
  console.log("💰 Total amount:", total_amount);

  const finalStatus = status || "pending";

  const expires_at =
    data.expires_at ??
    (finalStatus === "pending"
      ? dayjs.utc(start_time).subtract(5, "minute").toISOString()
      : null);

  // ===== CREATE RESERVATION WITH REAL PRICING =====
  const reservation = await this.reservationRepo.create({
    user_id,
    station_id,
    point_id,
    connector_type,
    start_time,
    end_time,
    status: finalStatus,
    price_per_min,
    total_amount,
    expires_at,
  });

  // ===== PREPARE PAYMENT PAYLOAD =====
  const payload = {
    user_id: reservation.user_id,
    type: "payment",
    method: payment_method,
    related_id: reservation.reservation_id,
    related_type: "booking",
    amount: total_amount,

    meta: {
      point_id,
      station_id,
      minutes,
      price_per_min,
      description: `Thanh toán đặt sạc tại trạm ${station_id}`,
      start_time,
      end_time,
    },
  };

  let paymentResponse = null;

  // ===== CALL PAYMENT SERVICE =====
  try {
    console.log("Sending payment payload:", payload);

    const res = await axios.post(
      `${config.PAYMENTBASE}/api/v1/payments/transaction`,
      payload,
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );

    paymentResponse = res.data;
  } catch (err) {
    paymentResponse = err.response
      ? { error: err.response.data, status: err.response.status }
      : { error: err.message };
  }

  return {
    reservation,
    payment: paymentResponse,
    pricing: pricingList,
    minutes,
    total_amount,
  };
}


  async confirmReservation(reservation_id, { payment_info = null } = {}) {
    if (!reservation_id) throw new Error('reservation_id is required');

    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (reservation.status === 'confirmed') return reservation;
    if (['cancelled', 'completed', 'expired'].includes(reservation.status))
      throw new Error(`Cannot confirm reservation in status ${reservation.status}`);

    const available = await this.reservationRepo.checkAvailability(
      reservation.station_id,
      reservation.point_id,
      reservation.start_time,
      reservation.end_time
    );

    if (!available) {
      await this.reservationRepo.markCancelled(reservation_id);
      withTimeout(
        EventBus.publish('booking.confirm.failed', {
          reservation_id,
          reason: 'slot_unavailable',
        })
      ).catch((err) => debug('publish booking.confirm.failed failed', err.message));

      throw new Error('Slot no longer available; reservation cancelled');
    }

    reservation.status = 'confirmed';
    reservation.expires_at = null;
    const updated = await this.reservationRepo.update(reservation);

    withTimeout(
      EventBus.publish('booking.confirmed', {
        reservation: updated,
        payment_info,
      })
    ).catch((err) => debug('publish booking.confirmed failed', err.message));

    return updated;
  }

  async markReservationFailed(reservation_id, { cancel = true, reason = null } = {}) {
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation) throw new Error('Reservation not found');

    if (cancel && reservation.status !== 'cancelled') {
      await this.reservationRepo.markCancelled(reservation_id);
    }

    withTimeout(
      EventBus.publish('booking.payment.failed', {
        reservation_id,
        cancel,
        reason,
      })
    ).catch((err) => debug('publish booking.payment.failed failed', err.message));

    return { reservation_id, cancelled: cancel };
  }

  // ================= GET RESERVATION =================
  async getReservationById(reservation_id) {
    if (!reservation_id) throw new Error('Missing reservation_id');
    return await this.reservationRepo.findById(reservation_id);
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
  // ================= UPDATE RESERVATION =================
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
          throw new Error('Cannot update reservation that has already started');
        }
      }

      const newStart = data.start_time ?? reservation.start_time;
      const newEnd = data.end_time ?? reservation.end_time;
      if ((data.start_time || data.end_time) && reservation.status === 'confirmed') {
        const available = await this.reservationRepo.checkAvailability(
          reservation.station_id,
          reservation.point_id,
          newStart,
          newEnd
        );
        if (!available) throw new Error('Charging point is already reserved for the new time slot');
      }

      Object.assign(reservation, {
        start_time: newStart,
        end_time: newEnd,
        status: data.status ?? reservation.status,
        price_per_min: typeof data.price_per_min === 'number' ? data.price_per_min : reservation.price_per_min,
        expires_at: data.expires_at ?? reservation.expires_at,
      });

      const updated = await this.reservationRepo.update(reservation);

      withTimeout(EventBus.publish('booking.updated', updated))
        .catch((err) => debug('publish booking.updated failed', err.message));

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

    withTimeout(
      EventBus.publish('booking.cancelled', {
        reservation_id,
        reason,
      })
    ).catch((err) => debug('publish booking.cancelled failed', err.message));

    return { message: 'Reservation cancelled successfully' };
  }

  async addToWaitlist({ user_id, station_id, connector_type }) {
    if (!user_id || !station_id || !connector_type) throw new Error('Missing waitlist fields');

    const entry = await this.waitlistRepo.create({ user_id, station_id, connector_type, status: 'waiting' });

    withTimeout(EventBus.publish('waitlist.added', entry))
      .then(() => debug('published waitlist.added', entry.waitlist_id))
      .catch((err) => debug('publish waitlist.added failed', err.message));

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

    withTimeout(EventBus.publish('waitlist.updated', waitlist))
      .catch((err) => debug('publish waitlist.updated failed', err.message));

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

    withTimeout(EventBus.publish('waitlist.removed', waitlist))
      .catch((err) => debug('publish waitlist.removed failed', err.message));

    return { success: true };
  }

  async createQr({ reservation_id, expires_in = 600 }) {
    if (!reservation_id || typeof reservation_id !== 'string') throw new Error('reservation_id required');

    const expires = Number(expires_in) || 600;
    if (!Number.isFinite(expires) || expires <= 0 || expires > 86400)
      throw new Error('expires_in invalid');

    const created = await this.qrRepo.create({ reservation_id, expires_in: expires });

    return {
      qr_code: created.qr_id,
      url: created.url,
      expires_at: created.expires_at,
    };
  }

  async validateQr(qr_id) {
    if (!qr_id) throw new Error('qr_id required');
    const qrCheck = await this.qrRepo.validate(qr_id);
    if (!qrCheck || qrCheck.valid === false) return { valid: false };
    return { valid: true, reservation_id: qrCheck.reservation_id };
  }

  async markUsed(qr_id) {
    if (!qr_id) throw new Error('qr_id required');
    await this.qrRepo.markUsed(qr_id);
  }

  async previewReserrvationCost(reservation_id, { roundUp = true } = {}) {
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation || !reservation.start_time) throw new Error('Reservation invalid');

    const end = reservation.end_time ? dayjs.utc(reservation.end_time) : dayjs.utc();
    const start = dayjs.utc(reservation.start_time);
    const diffMs = end.diff(start);
    const minutes = diffMs <= 0 ? 0 : (roundUp ? Math.ceil(diffMs / 60000) : Math.floor(diffMs / 60000));
    const pricePerMin = Number(reservation.price_per_min || 1000);
    const total = minutes * pricePerMin;

    return { minutes, total, price_per_min: pricePerMin };
  }

  async calculateReservationCost(reservation_id, { roundUp = true, payment_method = null } = {}) {
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
      const newPaymentMethod = (payment_method && ['wallet', 'bank_transfer'].includes(payment_method))
        ? payment_method
        : reservation.payment_method;

      await conn.query(
        `UPDATE reservations SET reserved_minutes = ?, total_cost = ?, payment_method = ?, updated_at = ? WHERE reservation_id = ?`,
        [minutes, total, newPaymentMethod, now, reservation_id]
      );

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
    const reservation = await this.reservationRepo.findById(reservation_id);
    if (!reservation || !reservation.start_time) throw new Error('Reservation invalid');

    const previousTotal = Number(reservation.total_cost || 0);
    const end = end_time ? dayjs.utc(end_time) : dayjs.utc();
    const start = dayjs.utc(reservation.start_time);
    if (end.isBefore(start)) throw new Error('end_time is before start_time');

    reservation.end_time = end.toISOString();
    reservation.status = 'completed';
    await this.reservationRepo.update(reservation);

    const calc = await this.calculateReservationCost(reservation_id, { roundUp });
    const newTotal = Number(calc.total || 0);

    let action = 'none', diff = 0, message = 'No adjustment necessary';
    if (newTotal > previousTotal) { action = 'charge_extra'; diff = newTotal - previousTotal; message = `Khách hàng cần trả thêm ${diff} VND.`; }
    else if (newTotal < previousTotal) { action = 'refund'; diff = previousTotal - newTotal; message = `Hoàn tiền ${diff} VND cho khách.`; }

    const result = { reservation_id, minutes: calc.minutes, previous_total: previousTotal, new_total: newTotal, difference: diff, action, message };

    withTimeout(EventBus.publish('booking.payment.adjustment', result))
      .catch((err) => debug('publish booking.payment.adjustment failed', err.message));

    return result;
  }

  async checkAvailability(station_id, point_id, start_time, end_time) {
    if (!station_id || !point_id || !start_time || !end_time) throw new Error('Missing availability parameters');
    return await this.reservationRepo.checkAvailability(station_id, point_id, start_time, end_time);
  }

  async autoCancelExpiredReservations() {
    const cancelled = await this.reservationRepo.autoCancelExpired(20);
    if (cancelled.length) {
      withTimeout(EventBus.publish('booking.auto.cancelled', cancelled))
        .catch((err) => debug('publish booking.auto.cancelled failed', err.message));
    }
    return cancelled;
  }
}

module.exports = new BookingService();
