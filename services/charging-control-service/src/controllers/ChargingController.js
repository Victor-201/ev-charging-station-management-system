// controllers/ChargingController.js
const ChargingService = require('../services/ChargingService');

function mapErrorToStatus(errMsg) {
  if (!errMsg) return 500;
  const m = errMsg.toLowerCase();
  if (m.includes('not found')) return 404;
  if (m.includes('missing') || m.includes('invalid') || m.includes('invalid session state')) return 400;
  if (m.includes('not pending') || m.includes('pending payment') || m.includes('not awaiting')) return 409;
  return 500;
}
// POST /api/v1/sessions/:session_id/confirm-payment
exports.confirmPayment = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const paid_amount = req.body.paid_amount != null ? Number(req.body.paid_amount) : null;
    const payment_method = req.body.payment_method || null;
    const payment_ref = req.body.payment_ref || null;

    // basic validation: paid_amount nếu có thì phải là số không âm
    if (paid_amount != null && (Number.isNaN(paid_amount) || paid_amount < 0)) {
      return res.status(400).json({ error: 'paid_amount must be a non-negative number' });
    }

    const result = await ChargingService.confirmPayment(session_id, { paid_amount, payment_method, payment_ref });

    return res.status(200).json({ status: 'confirmed', session: result });
  } catch (err) {
    console.error('[ChargingController.confirmPayment] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/users/:user_id/sessions?from=&to=&limit=&offset=&status=
exports.getUserSessions = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const from = req.query.from || null;
    const to = req.query.to || null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
    const status = req.query.status || null;

    const sessions = await ChargingService.getUserSessions(user_id, { from, to, limit, offset, status });
    return res.status(200).json({ count: sessions.length, sessions });
  } catch (err) {
    console.error('[ChargingController.getUserSessions] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/stations/:station_id/active-points
exports.getActivePoints = async (req, res) => {
  try {
    const station_id = req.params.station_id;
    if (!station_id) return res.status(400).json({ error: 'station_id is required' });

    const active = await ChargingService.getActivePointsByStation(station_id);
    return res.status(200).json({ count: active.length, active });
  } catch (err) {
    console.error('[ChargingController.getActivePoints] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/v1/sessions/:session_id/invoice
exports.getInvoice = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const session = await ChargingService.getSession(session_id);
    if (!session) return res.status(404).json({ error: 'Not found' });

    // invoice payload: cost, started_at, ended_at, duration_minutes
    const started = session.started_at ? new Date(session.started_at) : null;
    const ended = session.ended_at ? new Date(session.ended_at) : null;
    let duration_minutes = 0;
    if (started && ended) {
      const diffMs = ended.getTime() - started.getTime();
      duration_minutes = Math.ceil(diffMs / 60000);
      if (duration_minutes < 0) duration_minutes = 0;
    }

    const invoice = {
      session_id: session.session_id,
      user_id: session.user_id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      duration_minutes,
      cost: session.cost != null ? Number(session.cost) : 0,
      status: session.status,
    };

    return res.status(200).json({ invoice });
  } catch (err) {
    console.error('[ChargingController.getInvoice] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};


exports.initiateSession = async (req, res) => {
  try {
    // req.body should contain: { reservation_id?, station_id, point_id, user_id, vehicle_id?, auth_method?, connector_type? }
    const payload = req.body || {};

    // basic validation
    if (!payload.station_id) return res.status(400).json({ error: 'station_id is required' });
    if (!payload.point_id)   return res.status(400).json({ error: 'point_id is required' });
    if (!payload.user_id)    return res.status(400).json({ error: 'user_id is required' });

    // optional debug log — remove in production if noisy
    console.log('[ChargingController.initiateSession] payload:', {
      station_id: payload.station_id,
      point_id: payload.point_id,
      user_id: payload.user_id,
      reservation_id: payload.reservation_id || null,
    });

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
    const payment_method = req.body.payment_method || null; // optional: 'wallet'|'bank_transfer'|'cash'

    const result = await ChargingService.stopSession({ session_id, stop_reason, end_meter_wh, payment_method });
    // status 'pending' and include payment options & selected method
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