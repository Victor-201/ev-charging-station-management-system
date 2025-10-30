const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const { publish } = require('../../rabbit');

class SessionService {
  constructor(sessionRepo, telemetryRepo) {
    this.repo = sessionRepo;
    this.telemetryRepo = telemetryRepo;
  }

  async startSession(data) {
    const session = new Session({
      session_id: uuidv4(),
      user_id: data.user_id,
      point_id: data.point_id,
      vehicle_id: data.vehicle_id,
      reservation_id: data.reservation_id || null,
      start_meter_wh: data.start_meter_wh || 0,
      status: 'initiated',
      started_at: new Date(),
      metadata: data.metadata || {}
    });

    await this.repo.create(session);
    await publish('session_events', { type: 'SESSION_STARTED', data: session });

    return session;
  }

  async updateTelemetry(session_id, telemetryData) {
    await this.telemetryRepo.add({
      session_id,
      timestamp: new Date(),
      meter_wh: telemetryData.meter_wh,
      power_kw: telemetryData.power_kw,
      soc: telemetryData.soc
    });

    await publish('telemetry_events', {
      type: 'TELEMETRY_UPDATE',
      session_id,
      data: telemetryData
    });
  }

  async completeSession(session_id, end_meter_wh, cost) {
    const session = await this.repo.findById(session_id);
    if (!session) throw new Error('Session not found');

    await this.repo.updateMeters(session_id, session.start_meter_wh, end_meter_wh);
    await this.repo.updateStatus(session_id, 'completed');

    session.end_meter_wh = end_meter_wh;
    session.status = 'completed';
    session.ended_at = new Date();
    session.cost = cost;

    await publish('session_events', {
      type: 'SESSION_COMPLETED',
      data: session
    });

    return session;
  }

  async getActiveByUser(user_id) {
    return this.repo.findActiveByUser(user_id);
  }

  async getById(id) {
    return this.repo.findById(id);
  }
}

module.exports = SessionService;
