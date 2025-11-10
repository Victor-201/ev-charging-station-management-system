const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { publish } = require('../rabbit');

const SessionRepo = require('../repositories/SessionRepository');
const TelemetryRepo = require('../repositories/TelemetryRepository'); // giả sử tồn tại

class ChargingService {
  /**
   * /api/v1/sessions/initiate
   * Trả về { session_id, status }
   */
  async initiateSession({ reservation_id = null, station_id = null, point_id, user_id, vehicle_id = null, auth_method = null, connector_type = null } = {}) {
    // VALIDATION
    if (!point_id) throw new Error('Missing required field: point_id');
    if (!user_id) throw new Error('Missing required field: user_id');
    if (!station_id) throw new Error('Missing required field: station_id');

    // debug log để kiểm tra payload — xóa sau khi confirm
    console.log('[ChargingService.initiateSession] input:', { reservation_id, station_id, point_id, user_id, vehicle_id, auth_method, connector_type });

    const session = {
      session_id: uuidv4(),
      reservation_id: reservation_id || null,
      station_id: station_id || null,
      point_id,
      user_id,
      vehicle_id: vehicle_id || null,
      auth_method: auth_method || null,
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
    start_meter_wh: start_meter_wh != null ? start_meter_wh : s.start_meter_wh,
    started_at,
  });

  await publish('charging_events', { type: 'SESSION_STARTED', data: { session_id, started_at } });

  return { session_id: updated.session_id || session_id, status: updated.status || 'charging', started_at };
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
    await publish('telemetry_events', { type: 'METER_READING_PUSHED', data: reading });

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
    await publish('charging_events', { type: 'SESSION_PAUSED', data: { session_id } });
    return { session_id, status: 'paused' };
  }

  async resumeSession(session_id) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');
    if ((s.status || '').toLowerCase() !== 'paused') throw new Error('Session is not paused');

    await SessionRepo.updateStatus(session_id, 'charging');
    await publish('charging_events', { type: 'SESSION_RESUMED', data: { session_id } });
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

  await publish('charging_events', { type: 'SESSION_PENDING_PAYMENT', data: { session_id, ended_at, cost, stop_reason, payment_method: selected_method } });

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
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');

    if ((s.status || '').toLowerCase() !== 'pending') {
      throw new Error('Session is not pending payment');
    }

    // optional: record payment details into metadata (JSON) or payment table
    // We'll append payment info into metadata JSON column if present.
    let metadata = s.metadata && typeof s.metadata === 'object' ? s.metadata : {};
    metadata.payment = {
      paid_amount,
      payment_method,
      payment_ref,
      paid_at: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')
    };

    // update status -> confirmed and store metadata (and updated_at)
    const sets = [];
    const vals = [];

    // We'll reuse repository updateStatus for status + cost, but need to update metadata too.
    // Since updateStatus doesn't handle metadata, perform simple UPDATE query here:
    const q = `UPDATE sessions SET status = ?, metadata = ?, updated_at = ? WHERE session_id = ?`;
    const updated_at = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
    await require('../config/db').query(q, ['confirmed', JSON.stringify(metadata), updated_at, session_id]);

    // refetch
    const refreshed = await SessionRepo.getById(session_id);

    await publish('charging_events', { type: 'SESSION_PAYMENT_CONFIRMED', data: { session_id, paid_amount, payment_method, payment_ref } });

    return refreshed;
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
