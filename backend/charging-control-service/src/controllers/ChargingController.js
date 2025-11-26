// controllers/ChargingController.js
const ChargingService = require('../services/ChargingService');
const IoT = require('../iot/IoTManagerInstance');

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
exports.reconcileSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    // --- lấy token ---
    const authHeader = req.headers?.authorization || req.get('Authorization');
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader || null;
    const token = tokenFromHeader || req.user?.token || null;

    const autoSettle = req.body.auto_settle !== undefined ? Boolean(req.body.auto_settle) : false;
    const threshold = req.body.threshold != null ? Number(req.body.threshold) : 1000;
    const operator = req.body.operator || null;

    // --- gọi service đúng thứ tự tham số ---
    const result = await ChargingService.reconcileSessionWithReservation(
      token,
      session_id,
      { autoSettle, threshold, operator }
    );

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('[ChargingController.reconcileSession] error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error', debug: err.debug });
  }
};

exports.getPeakHours = async (req, res) => {
  try {
    const station_id = req.params.station_id;
    if (!station_id) return res.status(400).json({ error: 'station_id is required' });

    const peakHours = await ChargingService.getPeakHoursByStation(station_id);

    return res.status(200).json({
      station_id,
      peak_hours: peakHours
    });
  } catch (err) {
    console.error('[ChargingReportController.getPeakHours] error:', err);
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

exports.getAll = async (req, res) => {
  try {
    const data = await ChargingService.getAll(req.query);
    res.json(data);
  } catch (err) {
    console.error("getAll error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};



// GET /api/v1/stations/:station_id/daily-summary
exports.getDailySummaryByStation = async (req, res) => {
  try {
    const station_id = req.params.station_id;
    if (!station_id) return res.status(400).json({ error: 'station_id is required' });

    // --- lấy token từ header hoặc req.user ---
    const authHeader = req.headers?.authorization || req.get('Authorization');
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader || null;
    const token = tokenFromHeader || req.user?.token || null;

    if (!token) return res.status(401).json({ error: 'Authentication token is required' });

    // --- gọi service ---
    const summary = await ChargingService.summarizeDailyChargingByStation(token, station_id);

    // --- trả về ---
    return res.status(200).json({ ok: true, station_id, summary });
  } catch (err) {
    console.error('[ChargingController.getDailySummaryByStation] error:', err);
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
    // req.body should contain: { reservation_id?, station_id, point_id, user_id, auth_method?, connector_type? }
    const payload = req.body || {};

    // basic validation
    if (!payload.station_id) return res.status(400).json({ error: 'station_id is required' });
    if (!payload.point_id) return res.status(400).json({ error: 'point_id is required' });
    if (!payload.user_id) return res.status(400).json({ error: 'user_id is required' });

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

    const token = req.user?.token || null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is required to start session' });
    }

    // 1) Backend logic
    const result = await ChargingService.startSession({ session_id, start_meter_wh, token });

    // 2) Kích hoạt Fake IoT (pass token)
    console.log(`[Controller] Starting FakeIoT for session ${session_id}`);
    IoT.startDevice(session_id, token); // <-- changed

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

    const token = req.user?.token || null;

    const result = await ChargingService.pushMeterReading({
      session_id,
      timestamp,
      meter_wh,
      power_kw,
      soc,
      token
    });

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

// DELETE /api/v1/sessions/:session_id/telemetry
exports.deleteTelemetry = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id)
      return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.deleteBySessionId(session_id);

    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (err) {
    console.error('[ChargingController.deleteTelemetry] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({
      error: err.message || 'Internal server error'
    });
  }
};
// PUT /api/v1/sessions/:session_id/telemetry
exports.updateTelemetry = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id)
      return res.status(400).json({ error: 'session_id is required' });

    const body = req.body || {}; // <-- tránh undefined
    const { timestamp, meter_wh, power_kw, soc } = body;

    if (meter_wh == null && power_kw == null && soc == null) {
      return res.status(400).json({
        error: 'At least one field (meter_wh, power_kw, soc) must be provided'
      });
    }

    const result = await ChargingService.updateTelemetry({
      session_id,
      timestamp: timestamp || null,
      meter_wh,
      power_kw,
      soc
    });

    return res.status(200).json({
      ok: true,
      updated: true,
      result
    });
  } catch (err) {
    console.error('[ChargingController.updateTelemetry] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({
      error: err.message || 'Internal server error'
    });
  }
};



exports.pauseSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.pauseSession(session_id);

    // ❗ Pause IoT device
    console.log(`[Controller] Pausing FakeIoT for session ${session_id}`);
    IoT.pauseDevice(session_id);

    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.pauseSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};

exports.resumeSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await ChargingService.resumeSession(session_id);

    // Resume Fake IoT
    console.log(`[Controller] Resuming FakeIoT for session ${session_id}`);
    IoT.resumeDevice(session_id);

    return res.status(200).json(result);
  } catch (err) {
    console.error('[ChargingController.resumeSession] error:', err);
    const status = mapErrorToStatus(err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
};
// POST /api/v1/sessions/:session_id/stop
// controller (stopSession)
exports.stopSession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    if (!session_id)
      return res.status(400).json({ error: 'session_id is required' });

    // 1) Stop session in DB
    const stopped = await ChargingService.stopSession({ session_id });

    // Extract token
    const authHeader = req.headers?.authorization || req.get('Authorization');
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader || null;
    const token = tokenFromHeader || req.user?.token || null;

    // 2) Reconcile payment
    const settle = await ChargingService.reconcileSessionWithReservation(
      token,
      session_id,
    );

    // 3) Stop Fake IoT
    console.log(`[Controller] Stopping FakeIoT for session ${session_id}`);
    IoT.stopDevice(session_id);

    return res.status(200).json({
      ok: true,
      stop_result: stopped,
      settle_result: settle
    });
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