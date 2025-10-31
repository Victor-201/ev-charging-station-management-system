// controllers/ChargingController.js
const ChargingService = require('../services/ChargingService');

function mapErrorToStatus(errMsg) {
  if (!errMsg) return 500;
  const m = errMsg.toLowerCase();
  if (m.includes('not found')) return 404;
  if (m.includes('missing') || m.includes('invalid') || m.includes('invalid session state')) return 400;
  return 500;
}

exports.initiateSession = async (req, res) => {
  try {
    // req.body should contain: { reservation_id?, point_id, user_id, vehicle_id?, auth_method?, connector_type? }
    const payload = req.body || {};
    // basic validation
    if (!payload.point_id) return res.status(400).json({ error: 'point_id is required' });
    if (!payload.user_id)  return res.status(400).json({ error: 'user_id is required' });

    const result = await ChargingService.initiateSession(payload);
    // per API table: return { session_id, status }
    return res.status(201).json(result);
  } catch (err) {
    console.error('[ChargingController.initiateSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

exports.startSession = async (req, res) => {
  try {
    const { session_id, start_meter_wh } = req.body || {};
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.startSession({ session_id, start_meter_wh });
    // per API table: { session_id, status, started_at }
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.startSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

exports.pushMeterReading = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    const { timestamp, meter_wh, power_kw, soc } = req.body;

    if (!session_id) return res.status(400).json({ error: 'session_id is required' });
    if (meter_wh == null) return res.status(400).json({ error: 'meter_wh is required' });

    const result = await ChargingService.pushMeterReading({ session_id, timestamp, meter_wh, power_kw, soc });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.pushMeterReading] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/sessions/:session_id/telemetry
exports.getTelemetry = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const from = req.query.from || null;
    const to = req.query.to || null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

    const telemetry = await ChargingService.getTelemetry(session_id, { from, to, limit });
    return res.status(200).json({ telemetry });
  } catch (err) {
    console.error('[ChargingController.getTelemetry] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// POST /api/v1/sessions/:session_id/pause
exports.pauseSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.pauseSession(session_id);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.pauseSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// POST /api/v1/sessions/:session_id/resume
exports.resumeSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.resumeSession(session_id);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.resumeSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// POST /api/v1/sessions/:session_id/stop
exports.stopSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const stop_reason = req.body.stop_reason || 'user_stop';
    const end_meter_wh = req.body.end_meter_wh != null ? req.body.end_meter_wh : null;

    const result = await ChargingService.stopSession({ session_id, stop_reason, end_meter_wh });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.stopSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/sessions/:session_id
exports.getSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const data = await ChargingService.getSession(session_id);
    if (!data) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('[ChargingController.getSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/sessions/:session_id/events
exports.getEvents = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const events = await ChargingService.getEvents(session_id);
    return res.status(200).json({ events });
  } catch (err) {
    console.error('[ChargingController.getEvents] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};