const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { publishEvent } = require('../core/rabbit/publisher.js');
const { createConsumer } = require('../core/rabbit/consumer.js');
const pool = require('../config/db');
const SessionRepo = require('../repositories/SessionRepository');
const TelemetryRepo = require('../repositories/TelemetryRepository');
const EventOutboxRepo = require('../repositories/EventOutboxRepository');
const BookingService = require('./BookingService.js');
// Debug logger
const debug = (...args) => console.log('[ChargingService]', ...args);

class ChargingService {
  constructor() {
    this.sessionRepo = SessionRepo;
    this.bookingService = BookingService
    this.eventOutboxRepo = new EventOutboxRepo(pool);
  }

  // ============================================================
  // SUBSCRIBE PAYMENT EVENTS
  // ============================================================
  _subscribePaymentEvents() {
  console.log("[Charging] Listening to payment_queue...");

  createConsumer("payment_queue", async (routingKey, payload) => {
    console.log("[Charging ← Payment] Event received:", routingKey, payload);

    switch (routingKey) {
      case "payment.charging.success":
        try {
          console.log("💰 Payment succeeded:", payload.related_id);
          await this.confirmPayment(payload.related_id, {
            paid_amount: payload.amount,
            payment_method: payload.method,
            payment_ref: payload.ref
          });
        } catch (e) {
          console.error("confirmPayment error:", e.message);
        }
        break;

      case "payment.charging.failed":
        try {
          console.log("💸 Payment failed:", payload.related_id);
          await this.failPayment(payload.related_id, {
            reason: payload.reason,
            cancel: payload.cancelled
          });
        } catch (e) {
          console.error("failPayment error:", e.message);
        }
        break;

      default:
        console.log("⚠ Unknown routing key:", routingKey);
    }
  });
}

  async initiateSession({ reservation_id = null, station_id = null, point_id, user_id, connector_type = null } = {}) {
    // VALIDATION
    if (!point_id) throw new Error('Missing required field: point_id');
    if (!user_id) throw new Error('Missing required field: user_id');
    if (!station_id) throw new Error('Missing required field: station_id');

    // debug log để kiểm tra payload — xóa sau khi confirm
    console.log('[ChargingService.initiateSession] input:', { reservation_id, station_id, point_id, user_id,  connector_type });

    const session = {
      session_id: uuidv4(),
      reservation_id: reservation_id || null,
      station_id,
      point_id,
      user_id,
      connector_type: connector_type || null,
      status: 'initiated',
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
    };

    const created = await SessionRepo.create(session);

    await publish('charging_events', { type: 'SESSION_INITIATED', data: created });

    return { session_id: created.session_id, status: created.status };
  }


  /**
   * /api/v1/sessions/start
   * body: { session_id, start_meter_wh }
   * Trả về { session_id, status, started_at }
   */
async startSession({ session_id, start_meter_wh = null }) {
  const s = await SessionRepo.getById(session_id);
  if (!s) throw new Error('Charging session not found');

  if (!['initiated','pending','PENDING'].includes((s.status || '').toLowerCase())) {
    throw new Error(`Invalid session state for starting: ${s.status}`);
  }

  // format MySQL DATETIME(3)
  const started_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

  const updated = await SessionRepo.updateStatus(session_id, 'charging', {
    // only set start_meter_wh if provided (null means use existing in repo)
    ...(start_meter_wh != null ? { start_meter_wh } : {}),
    started_at,
  });

  publishEvent('charging_events', { type: 'SESSION_STARTED', data: { session_id, started_at } });

  return { session_id: updated.session_id || session_id, status: updated.status || 'charging', started_at };
}
async reconcileSessionWithReservation(
  token,
  session_id,
  { autoSettle = false, threshold = 1000, operator = null } = {}
) {
  if (!session_id) throw new Error("session_id is required");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ====================================
    // 1) LOCK SESSION
    // ====================================
    const [sessRows] = await conn.query(
      "SELECT * FROM sessions WHERE session_id = ? LIMIT 1 FOR UPDATE",
      [session_id]
    );
    if (!sessRows || !sessRows.length) throw new Error("Session not found");
    const s = sessRows[0];

    const now = dayjs().format("YYYY-MM-DD HH:mm:ss.SSS");

    // Parse metadata
    let meta = {};
    try {
      meta = s.metadata
        ? typeof s.metadata === "object"
          ? s.metadata
          : JSON.parse(s.metadata)
        : {};
    } catch (e) {
      meta = {};
    }

    // ====================================
    // 2) CASE: NO RESERVATION
    // ====================================
    if (!s.reservation_id) {
      const actual = Number(s.cost || 0);

      meta.reconciliation = {
        action: "no_reservation",
        note: "Session has no reservation, settled using actual cost",
        actual,
        at: now,
        operator,
      };

      await conn.query(
        "UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?",
        [JSON.stringify(meta), now, session_id]
      );

      await conn.commit();
      return {
        session_id,
        reservation_id: null,
        reserved: 0,
        actual,
        diff: 0,
        action: "settled_no_reservation",
      };
    }

    // ====================================
    // 3) LOCK RESERVATION
    // ====================================
    const [resRows] = await conn.query(
      "SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1 FOR UPDATE",
      [s.reservation_id]
    );
    if (!resRows || !resRows.length) throw new Error("Reservation not found");
    const reservation = resRows[0];

    const point_id = reservation.point_id;
    const start_time = reservation.start_time;
    const end_time = reservation.end_time;

    // ====================================
    // 4) CALCULATE RESERVED COST (IF NEEDED)
    // ====================================
    let reservedTotal = Number(reservation.total_cost || 0);

    if (!reservedTotal || reservedTotal === 0) {
      if (!reservation.start_time) {
        reservedTotal = 0;
      } else {
        const {
          price_per_min,
          minutes,
          total_amount,
        } = await this.bookingService.calculatePricing(point_id, start_time, end_time, token);

        reservedTotal = total_amount;

        await conn.query(
          "UPDATE reservations SET reserved_minutes = ?, total_cost = ?, price_per_min = ?, updated_at = ? WHERE reservation_id = ?",
          [
            minutes,
            total_amount,
            price_per_min,
            now,
            reservation.reservation_id,
          ]
        );
      }
    }

    // ====================================
    // 5) COMPARE ACTUAL vs RESERVED
    // ====================================
    const actual = Number(s.cost != null ? s.cost : 0);
    const reserved = Number(reservedTotal || 0);
    const diff = actual - reserved;

    const result = {
      session_id,
      reservation_id: reservation.reservation_id,
      reserved,
      actual,
      diff,
    };

    // ====================================
    // CASE 1 — WITHIN THRESHOLD
    // ====================================
    if (Math.abs(diff) <= Number(threshold || 0)) {
      await conn.query(
        "UPDATE reservations SET final_cost = ?, status = ?, updated_at = ? WHERE reservation_id = ?",
        [actual, "completed", now, reservation.reservation_id]
      );

      meta.reconciliation = {
        action: "settled",
        note: `diff ${diff} within threshold ${threshold}`,
        at: now,
        operator,
      };

      await conn.query(
        "UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?",
        [JSON.stringify(meta), now, session_id]
      );

      await conn.commit();

      result.action = "settled";
      return result;
    }

    // ====================================
    // CASE 2 — REFUND
    // ====================================
    if (diff < -threshold) {
      const refundAmount = Math.round(-diff);

      await conn.query(
        "UPDATE reservations SET final_cost = ?, status = ?, updated_at = ? WHERE reservation_id = ?",
        [actual, "completed", now, reservation.reservation_id]
      );

      meta.reconciliation = meta.reconciliation || {};
      meta.reconciliation.action = "refund";
      meta.reconciliation.refund = {
        amount: refundAmount,
        currency: "VND",
        issued: !!autoSettle,
        issued_at: autoSettle ? now : null,
        operator,
        note: `actual ${actual} < reserved ${reserved}`,
      };

      meta.payment = meta.payment || {};
      meta.payment.refund = {
        amount: refundAmount,
        method: reservation.payment_method || "bank_transfer",
        at: autoSettle ? now : null,
      };

      await conn.query(
        "UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?",
        [JSON.stringify(meta), now, session_id]
      );

      await conn.commit();

      result.action = "refund";
      result.refundAmount = refundAmount;
      result.autoSettled = !!autoSettle;
      return result;
    }

    // ====================================
    // CASE 3 — CHARGE DUE
    // ====================================
    if (diff > threshold) {
      const dueAmount = Math.round(diff);

      await conn.query(
        "UPDATE reservations SET final_cost = ?, status = ?, updated_at = ? WHERE reservation_id = ?",
        [actual, "completed", now, reservation.reservation_id]
      );

      meta.reconciliation = meta.reconciliation || {};
      meta.reconciliation.action = "charge_due";
      meta.reconciliation.due = {
        amount: dueAmount,
        currency: "VND",
        charged: !!autoSettle,
        charged_at: autoSettle ? now : null,
        operator,
        note: `actual ${actual} > reserved ${reserved}`,
      };

      meta.payment = meta.payment || {};
      meta.payment.charge = {
        amount: dueAmount,
        method: reservation.payment_method || "bank_transfer",
        at: autoSettle ? now : null,
      };

      await conn.query(
        "UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?",
        [JSON.stringify(meta), now, session_id]
      );

      await conn.commit();

      result.action = "charge_due";
      result.dueAmount = dueAmount;
      result.autoSettled = !!autoSettle;
      return result;
    }

    // ====================================
    // DEFAULT
    // ====================================
    await conn.commit();
    result.action = "no_action";
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

  /**
   * /api/v1/sessions/{session_id}/meter  (push meter)
   * body: { timestamp, meter_wh, power_kw, soc }
   */
  async pushMeterReading({ session_id, timestamp = null, meter_wh, power_kw = null, soc = null }) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');

    // allow telemetry push even if paused/charging (but typically require started)
    // Here we accept when status is charging or paused
    if (!['charging','paused','ACTIVE','active'].includes((s.status || '').toLowerCase())) {
      throw new Error('Session is not active for meter pushing');
    }

    const reading = {
      telemetry_id: uuidv4(),
      session_id,
      timestamp: timestamp || dayjs().toISOString(),
      meter_wh: meter_wh != null ? meter_wh : null,
      power_kw: power_kw != null ? power_kw : null,
      soc: soc != null ? soc : null,
      created_at: dayjs().toISOString(),
    };

    await TelemetryRepo.create(reading);
    publishEvent('telemetry_events', { type: 'METER_READING_PUSHED', data: reading });

    return { status: 'ok' };
  }

  /**
   * GET /api/v1/sessions/{session_id}/telemetry
   */
  async getTelemetry(session_id, { from = null, to = null, limit = 100 } = {}) {
    // simply delegate to TelemetryRepo; TelemetryRepo should support filters
    return await TelemetryRepo.getBySessionId(session_id, { from, to, limit });
  }

  async pauseSession(session_id) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');
    if (!['charging','ACTIVE','active'].includes((s.status || '').toLowerCase())) {
      throw new Error('Cannot pause a non-active charging session');
    }

    await SessionRepo.updateStatus(session_id, 'paused');
    publishEvent('charging_events', { type: 'SESSION_PAUSED', data: { session_id } });
    return { session_id, status: 'paused' };
  }

  async resumeSession(session_id) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');
    if ((s.status || '').toLowerCase() !== 'paused') throw new Error('Session is not paused');

    await SessionRepo.updateStatus(session_id, 'charging');
    publishEvent('charging_events', { type: 'SESSION_RESUMED', data: { session_id } });
    return { session_id, status: 'charging' };
  }

  /**
   * /api/v1/sessions/{session_id}/stop
   * body: { stop_reason, end_meter_wh }
   * Trả về: { session_id, status: 'finished', kwh, cost }
   */
  async stopSession({ session_id, stop_reason = 'user_stop', end_meter_wh = null, payment_method = null } = {}) {
  const s = await SessionRepo.getById(session_id);
  if (!s) throw new Error('Charging session not found');

  if (!['charging','paused','active','ACTIVE'].includes((s.status || '').toLowerCase())) {
    throw new Error('Invalid session state for stopping');
  }

  // ended_at now
  const ended_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

  // compute cost based on time difference: minutes * 1000
  let cost = null;
  let duration_minutes = 0;
  try {
    const startAt = s.started_at ? dayjs(s.started_at) : null;
    const endAt = dayjs(ended_at);
    if (startAt) {
      const diffMs = endAt.valueOf() - startAt.valueOf();
      let minutes = Math.ceil(diffMs / 60000); // charge per started minute
      if (minutes < 0) minutes = 0;
      duration_minutes = minutes;
      cost = minutes * 1000; // 1000 đồng per minute
    } else {
      // nếu không có started_at thì tính 0 phút
      duration_minutes = 0;
      cost = 0;
    }
  } catch (err) {
    // fallback
    duration_minutes = 0;
    cost = 0;
  }

  const endMeterValue = end_meter_wh != null ? end_meter_wh : (s.end_meter_wh != null ? s.end_meter_wh : null);

  // set default payment method if none provided
  const AVAILABLE_METHODS = ['wallet', 'bank_transfer', 'cash'];
  const normalized = (typeof payment_method === 'string' && payment_method.length) ? String(payment_method).toLowerCase() : null;
  const selected_method = AVAILABLE_METHODS.includes(normalized) ? normalized : 'bank_transfer';

  // update status -> pending and set end_meter_wh, ended_at, cost
  const updated = await SessionRepo.updateStatus(session_id, 'pending', {
    end_meter_wh: endMeterValue,
    ended_at,
    cost,
  });

  // attach payment info into metadata JSON column (merge with existing metadata if any)
  try {
    const existingMeta = updated.metadata && typeof updated.metadata === 'object'
      ? updated.metadata
      : (updated.metadata ? JSON.parse(updated.metadata) : {});

    existingMeta.payment = existingMeta.payment || {};
    existingMeta.payment.method = selected_method;
    existingMeta.payment.status = 'pending';
    existingMeta.payment.amount = cost;
    existingMeta.payment.created_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
    existingMeta.payment.stop_reason = stop_reason;

    // persist metadata
    await pool.query('UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?', [
      JSON.stringify(existingMeta),
      dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
      session_id,
    ]);
  } catch (err) {
    // non-fatal: log and continue
    console.error('[stopSession] failed to persist metadata.payment', err);
  }

  publishEvent('charging_events', { type: 'SESSION_PENDING_PAYMENT', data: { session_id, ended_at, cost, stop_reason, payment_method: selected_method } });

  return {
    session_id: updated.session_id || session_id,
    status: 'pending',
    cost,
    duration_minutes,

    selected_payment_method: selected_method
  };
}
  /**
   * Trả về lịch sử session của 1 user (delegates to repo)
   * opts: { from, to, limit, offset, status }
   */
  async getUserSessions(user_id, opts = {}) {
    if (!user_id) throw new Error('user_id is required');
    return await SessionRepo.getByUserId(user_id, opts);
  }

  /**
   * Trả về danh sách điểm đang sạc cho station_id
   */
  async getActivePointsByStation(station_id) {
    if (!station_id) throw new Error('station_id is required');
    return await SessionRepo.getActiveByStationId(station_id);
  }

async confirmPayment(session_id, { paid_amount = null, payment_method = null, payment_ref = null } = {}) {
  if (!session_id) throw new Error('session_id is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock session row for update
    const [rows] = await conn.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1 FOR UPDATE', [session_id]);
    const s = rows && rows[0];
    if (!s) {
      await conn.rollback();
      throw new Error('Charging session not found');
    }

    if ((s.status || '').toLowerCase() !== 'pending') {
      await conn.rollback();
      throw new Error('Session is not pending payment');
    }

    // parse existing metadata
    let metadata = {};
    try { metadata = s.metadata ? JSON.parse(s.metadata) : {}; } catch (e) { metadata = {}; }

    // attach payment info
    metadata.payment = metadata.payment || {};
    metadata.payment.status = 'succeeded';
    metadata.payment.paid_amount = paid_amount;
    metadata.payment.payment_method = payment_method;
    metadata.payment.payment_ref = payment_ref;
    metadata.payment.paid_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    const updated_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    // update session: status -> confirmed (or paid), update metadata and updated_at
    // you can adjust the target status string to fit your domain ('confirmed' / 'paid' etc.)
    await conn.query(
      'UPDATE sessions SET status = ?, metadata = ?, updated_at = ? WHERE session_id = ?',
      ['confirmed', JSON.stringify(metadata), updated_at, session_id]
    );

    // Optional: insert a payment record into payments table if you have one.
    // await conn.query('INSERT INTO payments (...) VALUES (...)', [...]);

    await conn.commit();
    conn.release();

    // refetch using repository (non-transactional read)
    const refreshed = await SessionRepo.getById(session_id);

    // publish events (external payment system listeners + internal charging events)
    // payload shapes are suggestions — adapt to your existing consumers
    const paymentPayload = {
      related_id: session_id,
      amount: paid_amount,
      method: payment_method,
      ref: payment_ref,
      paid_at: metadata.payment.paid_at
    };

    // Event for other services (e.g., billing) — consistent with your EventBus naming
    publishEvent('payment.session.succeeded', paymentPayload);
    // Internal charging event channel
    publishEvent('charging_events', { type: 'SESSION_PAYMENT_CONFIRMED', data: { session_id, paid_amount, payment_method, payment_ref } });

    debug('confirmPayment: success for session', session_id);
    return refreshed;
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* ignore */ }
    try { conn.release(); } catch (e) { /* ignore */ }
    debug('confirmPayment error:', err.message);
    throw err;
  }
}

async failPayment(session_id, { reason = null, cancel = false } = {}) {
  if (!session_id) throw new Error('session_id is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock session
    const [rows] = await conn.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1 FOR UPDATE', [session_id]);
    const s = rows && rows[0];
    if (!s) {
      await conn.rollback();
      throw new Error('Charging session not found');
    }

    if ((s.status || '').toLowerCase() !== 'pending') {
      await conn.rollback();
      throw new Error('Session is not pending payment');
    }

    // parse existing metadata
    let metadata = {};
    try { metadata = s.metadata ? JSON.parse(s.metadata) : {}; } catch (e) { metadata = {}; }

    metadata.payment = metadata.payment || {};
    metadata.payment.status = 'failed';
    metadata.payment.reason = reason;
    metadata.payment.failed_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    // decide new status
    const newStatus = cancel ? 'cancelled' : 'payment_failed';
    const updated_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    await conn.query(
      'UPDATE sessions SET status = ?, metadata = ?, updated_at = ? WHERE session_id = ?',
      [newStatus, JSON.stringify(metadata), updated_at, session_id]
    );

    await conn.commit();
    conn.release();

    const refreshed = await SessionRepo.getById(session_id);

    // publish failure events
    const failPayload = {
      related_id: session_id,
      reason,
      cancelled: !!cancel,
      failed_at: metadata.payment.failed_at
    };

    publishEvent('payment.session.failed', failPayload);
    publishEvent('charging_events', { type: 'SESSION_PAYMENT_FAILED', data: { session_id, reason, cancelled: !!cancel } });

    debug('failPayment: processed for session', session_id);
    return refreshed;
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* ignore */ }
    try { conn.release(); } catch (e) { /* ignore */ }
    debug('failPayment error:', err.message);
    throw err;
  }
}

  // ... other methods ...

  async getSession(session_id) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');
    return s;
  }

  async getEvents(session_id) {
    return await SessionRepo.getEvents(session_id);
  }
}

module.exports = new ChargingService();
