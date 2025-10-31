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
  async initiateSession({ reservation_id = null, point_id, user_id, vehicle_id = null, auth_method = null, connector_type = null }) {
    if (!point_id) throw new Error('Missing required field: point_id');
    if (!user_id) throw new Error('Missing required field: user_id');

    const session = {
      session_id: uuidv4(),
      reservation_id: reservation_id || null,
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

    // Minimal response shape per your API table
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
  async stopSession({ session_id, stop_reason = 'user_stop', end_meter_wh = null }) {
    const s = await SessionRepo.getById(session_id);
    if (!s) throw new Error('Charging session not found');

    if (!['charging','paused','ACTIVE','active'].includes((s.status || '').toLowerCase())) {
      throw new Error('Invalid session state for stopping');
    }

    // compute kWh from meters if possible
    const startMeter = s.start_meter_wh != null ? Number(s.start_meter_wh) : null;
    const endMeter = end_meter_wh != null ? Number(end_meter_wh) : (s.end_meter_wh != null ? Number(s.end_meter_wh) : null);

    let kwh = null;
    if (startMeter != null && endMeter != null) {
      kwh = (endMeter - startMeter) / 1000; // Wh -> kWh
      if (kwh < 0) kwh = 0;
    }

    // simple cost calc — set default rate (adjust as needed)
    const RATE_PER_KWH = 200000; // unit e.g. VND per kWh (adjust to your pricing)
    const cost = kwh != null ? Math.round(kwh * RATE_PER_KWH) : null;

    const ended_at = dayjs().toISOString();

    await SessionRepo.updateStatus(session_id, 'finished', {
      end_meter_wh: endMeter,
      ended_at,
      kwh,
      cost,
    });

    await publish('charging_events', { type: 'SESSION_FINISHED', data: { session_id, ended_at, kwh, cost, stop_reason } });

    return { session_id, status: 'finished', kwh, cost };
  }

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
