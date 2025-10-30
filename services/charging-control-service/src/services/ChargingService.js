const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { publish } = require('../rabbit');

const SessionRepo = require('../repositories/SessionRepository');
const TelemetryRepo = require('../repositories/TelemetryRepository');

class ChargingService {
  /**
   * Initialize a new charging session (not yet started)
   */
  async initiateSession({ reservation_id = null, charging_point_id, user_id, connector_type }) {
    if (!charging_point_id || !user_id)
      throw new Error('Missing required fields to initiate a session');
    
    let is_booking = !!reservation_id; // khi là đặt chỗ thì thay đổi status của reservation thành confirmed

    const session = {
      session_id: uuidv4(),
      reservation_id,
      charging_point_id,
      user_id,
      connector_type,
      status: 'PENDING',
      start_time: null,
      end_time: null,
      created_at: dayjs().toISOString(),
    };

    await SessionRepo.create(session);
    await publish('charging_events', { type: 'SESSION_INITIATED', data: session });

    return session;
  }

  /**
   * Start a charging session
   */
  async startSession(session_id) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    if (session.status !== 'PENDING') throw new Error('Invalid session state for starting');

    const start_time = dayjs().toISOString();
    await SessionRepo.updateStatus(session_id, 'ACTIVE', start_time);

    const updated = { ...session, status: 'ACTIVE', start_time };
    await publish('charging_events', { type: 'SESSION_STARTED', data: updated });

    return updated;
  }

  /**
   * Push a new meter reading (telemetry data)
   */
  async pushMeterReading({ session_id, voltage, current, energy, timestamp }) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    if (session.status !== 'ACTIVE') throw new Error('Session is not ACTIVE');

    const reading = {
      telemetry_id: uuidv4(),
      session_id,
      voltage,
      current,
      energy,
      timestamp: timestamp || dayjs().toISOString(),
    };

    await TelemetryRepo.create(reading);
    await publish('telemetry_events', { type: 'METER_READING_PUSHED', data: reading });

    return reading;
  }

  /**
   * Retrieve telemetry data for a session
   */
  async getTelemetry(session_id) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    return await TelemetryRepo.getBySessionId(session_id);
  }

  /**
   * Pause an active charging session
   */
  async pauseSession(session_id) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    if (session.status !== 'ACTIVE')
      throw new Error('Cannot pause a non-active charging session');

    await SessionRepo.updateStatus(session_id, 'PAUSED');
    await publish('charging_events', { type: 'SESSION_PAUSED', data: { session_id } });

    return { session_id, status: 'PAUSED' };
  }

  /**
   * Resume a paused charging session
   */
  async resumeSession(session_id) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    if (session.status !== 'PAUSED')
      throw new Error('Session is not in a paused state');

    await SessionRepo.updateStatus(session_id, 'ACTIVE');
    await publish('charging_events', { type: 'SESSION_RESUMED', data: { session_id } });

    return { session_id, status: 'ACTIVE' };
  }

  /**
   * Stop (complete) a charging session
   */
  async stopSession(session_id) {
    const session = await SessionRepo.getById(session_id);
    if (!session) throw new Error('Charging session not found');
    if (!['ACTIVE', 'PAUSED'].includes(session.status))
      throw new Error('Invalid session state for stopping');

    const end_time = dayjs().toISOString();
    await SessionRepo.updateStatus(session_id, 'COMPLETED', null, end_time);

    await publish('charging_events', {
      type: 'SESSION_COMPLETED',
      data: { session_id, end_time },
    });

    return { session_id, status: 'COMPLETED', end_time };
  }

  /**
   * Get a single charging session by ID
   */
  async getSession(session_id) {
    return await SessionRepo.getById(session_id);
  }
}

module.exports = new ChargingService();
