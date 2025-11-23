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

async initSubscriptions() {
    await createConsumer(
      "payment_charging_queue",
      "payment.charging.*",
      async (routingKey, payload) => {
        console.log("[Charging] Event:", routingKey);

        if (routingKey === "payment.charging.succeeded") {
          await this.confirmReservation(payload.related_id, { payment_info: payload });
        } else if (routingKey === "payment.charging.failed") {
          await this.markReservationFailed(payload.related_id, {
            cancel: true,
            reason: payload.reason,
          });
        }
      }
    );
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

 publishEvent('charging_events', { type: 'SESSION_INITIATED', data: created });

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

  publishEvent('start_session', { type: 'SESSION_STARTED', data: { point_id: s.point_id, started_at } });

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

    // 1) LOCK SESSION
    const [sessRows] = await conn.query(
      "SELECT * FROM sessions WHERE session_id = ? FOR UPDATE",
      [session_id]
    );
    if (!sessRows.length) throw new Error("Session not found");
    const session = sessRows[0];

    const started_at = session.started_at ? dayjs(session.started_at) : null;
    const ended_at = session.ended_at ? dayjs(session.ended_at) : dayjs();

    // 2) LOAD RESERVATION (IF ANY)
    let reservation = null;
    if (session.reservation_id) {
      const [resRows] = await conn.query(
        "SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE",
        [session.reservation_id]
      );
      reservation = resRows.length ? resRows[0] : null;
    }

    // 3) CALCULATE SESSION PRICE
    let sessionCost = 0;
    let sessionMinutes = 0;
    if (started_at) {
      sessionMinutes = Math.max(0, ended_at.diff(started_at, "minute"));

      const pricing = await this.bookingService.calculatePricing(
        session.point_id,
        started_at.toISOString(),
        ended_at.toISOString(),
        token
      );

      sessionCost = Number(pricing.total_amount || 0);
    }

    // 4) CALCULATE RESERVED COST
    let reservedCost = 0;
    if (reservation) {
      if (reservation.total_cost && Number(reservation.total_cost) > 0) {
        reservedCost = Number(reservation.total_cost);
      } else if (reservation.start_time && reservation.end_time) {
        const rp = await this.bookingService.calculatePricing(
          reservation.point_id,
          reservation.start_time,
          reservation.end_time
        );
        reservedCost = Number(rp.total_amount || 0);

        await conn.query(
          "UPDATE reservations SET total_cost = ?, updated_at = NOW(3) WHERE reservation_id = ?",
          [reservedCost, reservation.reservation_id]
        );
      }
    }

    // 5) CALCULATE DIFF AND SETTLEMENT
    const diff = sessionCost - reservedCost;

    let settlementType = "none";
    let settleAmount = 0;
    let settlementMessage = "";

    if (diff > 0) {
      settlementType = "charge";
      settleAmount = diff;
      settlementMessage = `Khách hàng cần thanh toán thêm ${diff}.`;
    } else if (diff < 0) {
      settlementType = "refund";
      settleAmount = Math.abs(diff);
      settlementMessage = `Khách hàng được hoàn lại ${Math.abs(diff)}.`;
    } else {
      settlementType = "none";
      settleAmount = 0;
      settlementMessage = "Không phát sinh thu thêm hoặc hoàn tiền.";
    }

    // 6) UPDATE SESSION
    session.metadata = session.metadata
      ? (typeof session.metadata === "object" ? session.metadata : JSON.parse(session.metadata))
      : {};

    session.metadata.payment = session.metadata.payment || {};
    session.metadata.payment.status = settleAmount > 0 ? "settlement_required" : "completed";
    session.metadata.payment.session_cost = sessionCost;
    session.metadata.payment.reserved_cost = reservedCost;
    session.metadata.payment.diff = diff;
    session.metadata.payment.operator = operator;
    session.metadata.payment.settlement_type = settlementType;
    session.metadata.payment.settlement_amount = settleAmount;
    session.metadata.payment.settlement_message = settlementMessage;
    session.metadata.payment.finalized_at = dayjs().format("YYYY-MM-DD HH:mm:ss.SSS");
    session.metadata.session_minutes = sessionMinutes; // lưu vào metadata, không lỗi SQL



    await conn.commit();

    return {
      ok: true,
      session_id,
      session_cost: sessionCost,
      reserved_cost: reservedCost,
      diff,
      settlement: {
        type: settlementType,
        amount: settleAmount,
        message: settlementMessage,
      },
    };
  } catch (err) {
    await conn.rollback();
    console.error("[reconcileSessionWithReservation] ERROR:", err);
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
  async stopSession({ session_id } = {}) {
  const s = await SessionRepo.getById(session_id);
  if (!s) throw new Error('Charging session not found');

  if (!['charging', 'paused', 'active', 'ACTIVE'].includes((s.status || '').toLowerCase())) {
    throw new Error('Invalid session state for stopping');
  }

  const ended_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

  // ⚠ cost không tính ở đây nữa
  const cost = 0;

  const updated = await SessionRepo.updateStatus(session_id, 'pending', {
    ended_at,
    cost,
  });

  // --- cập nhật metadata.payment (không set số tiền)
  try {
    const meta = updated.metadata
      ? (typeof updated.metadata === 'object'
          ? updated.metadata
          : JSON.parse(updated.metadata))
      : {};

    meta.payment = meta.payment || {};
    meta.payment.status = 'pending';
    meta.payment.created_at = ended_at;

    await pool.query(
      'UPDATE sessions SET metadata = ?, updated_at = ? WHERE session_id = ?',
      [JSON.stringify(meta), ended_at, session_id],
    );
  } catch (err) {
    console.error('[stopSession] failed to persist metadata.payment', err);
  }

  publishEvent('stop_session', {
    type: 'SESSION_PENDING_PAYMENT',
    data: { point_id: s.point_id, ended_at }
  });

  return {
    session_id,
    status: 'pending',
    cost: 0,
    duration_minutes: 0,
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
