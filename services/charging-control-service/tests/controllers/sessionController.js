const logic = require('../logic/sessionLogic');

async function initiateSession(req, res) {
  try {
    const { point_id, user_id, vehicle_id, auth_method, reservation_id } = req.body;
    if (!point_id || !user_id) return res.status(400).json({ error: 'missing point_id or user_id' });
    const r = await logic.initiateSession({ point_id, user_id, vehicle_id, auth_method, reservation_id });
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function startSession(req, res) {
  try {
    const { session_id, start_meter_wh } = req.body;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });
    const r = await logic.startSession({ session_id, start_meter_wh });
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function pushMeterReading(req, res) {
  try {
    const session_id = req.params.session_id;
    const { timestamp, meter_wh, power_kw, soc } = req.body;
    if (!timestamp || meter_wh === undefined) 
      return res.status(400).json({ error: 'missing timestamp or meter_wh' });

    await logic.pushMeterReading(session_id, { timestamp, meter_wh, power_kw, soc });

    return res.json({ status: 'ok' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getTelemetry(req, res) {
  try {
    const session_id = req.params.session_id;
    const { from, to, limit } = req.query;
    const data = await logic.getTelemetry(session_id, from, to, limit);
    return res.json({ telemetry: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function pauseSession(req, res) {
  try {
    const session_id = req.params.session_id;
    const r = await logic.pauseSession(session_id);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function resumeSession(req, res) {
  try {
    const session_id = req.params.session_id;
    const r = await logic.resumeSession(session_id);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function stopSession(req, res) {
  try {
    const session_id = req.params.session_id;
    const r = await logic.stopSession(session_id, req.body);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getSession(req, res) {
  try {
    const session_id = req.params.session_id;
    const r = await logic.getSession(session_id);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getEvents(req, res) {
  try {
    const session_id = req.params.session_id;
    const r = await logic.getEvents(session_id);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = {
  initiateSession,
  startSession,
  pushMeterReading,
  getTelemetry,
  pauseSession,
  resumeSession,
  stopSession,
  getSession,
  getEvents
};
