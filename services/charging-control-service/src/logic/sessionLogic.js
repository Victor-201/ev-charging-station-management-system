// src/logic/sessionLogic.js
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const { publish } = require('../rabbit');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

/**
 * Check exact UUID v4-ish format (36 chars with hyphens)
 */
function isUuidStrict(v) {
  return typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v.trim());
}

/**
 * Normalize incoming session_id:
 * - If not a string -> return { id: null, valid: false }
 * - Trim whitespace
 * - If length > 36 and first 36 chars look like UUID -> truncate and mark truncated
 * - Return { id: normalizedString, valid: boolean } where valid indicates strict UUID match AFTER normalization
 *
 * Note: We intentionally allow non-UUID strings (e.g. "S001") to pass through (valid=false)
 * but we return the trimmed string so DB lookups still attempt to find the session.
 * This matches a "forgiving" behavior for dev/test while still logging warnings.
 */
function normalizeSessionId(raw) {
  if (typeof raw !== 'string') return { id: null, valid: false, truncated: false };

  const trimmed = raw.trim();

  if (trimmed.length === 0) return { id: null, valid: false, truncated: false };

  // If longer than 36 and first 36 chars match UUID pattern, truncate and warn
  if (trimmed.length > 36) {
    const head36 = trimmed.slice(0, 36);
    if (isUuidStrict(head36)) {
      console.warn(`⚠️ UUID too long, auto-truncated: ${trimmed} → ${head36}`);
      return { id: head36, valid: true, truncated: true };
    }
  }

  // If exactly 36 and strict uuid => valid
  if (isUuidStrict(trimmed)) return { id: trimmed, valid: true, truncated: false };

  // Not a strict UUID, but return trimmed value so DB queries still run.
  // Log a warning so developer can notice misuse.
  if (!isUuidStrict(trimmed)) {
    console.warn(`⚠️ session_id not UUID (forgiving): ${trimmed}`);
  }

  return { id: trimmed, valid: false, truncated: false };
}

/**
 * Convert input to SQL DATETIME (UTC)
 */
function toSqlDatetime(input) {
  const d = dayjs(input);
  if (!d.isValid()) throw new Error('invalid_timestamp');
  return d.utc().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Helper: check existence (returns boolean)
 * NOTE: table and column must be trusted values in code.
 */
async function exists(table, column, value) {
  const q = `SELECT 1 FROM \`${table}\` WHERE \`${column}\` = ? LIMIT 1`;
  const [rows] = await pool.query(q, [value]);
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Initiate a session - check point/user/vehicle/reservation existence first
 */
async function initiateSession({ point_id, user_id, vehicle_id, auth_method, reservation_id }) {
  if (!point_id || !user_id) throw new Error('missing_params');

  // trim inputs
  point_id = String(point_id).trim();
  user_id = String(user_id).trim();
  if (vehicle_id) vehicle_id = String(vehicle_id).trim();

  // check point exists
  const pointExists = await exists('points', 'point_id', point_id);
  if (!pointExists) throw new Error('point_not_found');

  // check user exists
  const userExists = await exists('users', 'user_id', user_id);
  if (!userExists) throw new Error('user_not_found');

  // vehicle is optional
  if (vehicle_id) {
    const vehicleExists = await exists('vehicles', 'vehicle_id', vehicle_id);
    if (!vehicleExists) throw new Error('vehicle_not_found');
  }

  // reservation optional
  if (reservation_id) {
    const [rrows] = await pool.query(
      'SELECT reservation_id, user_id, point_id, status FROM reservations WHERE reservation_id = ? LIMIT 1',
      [reservation_id]
    );
    if (!rrows || rrows.length === 0) throw new Error('reservation_not_found');
    if (rrows[0].status !== 'confirmed') throw new Error('reservation_not_confirmed');
    if (rrows[0].point_id !== point_id) throw new Error('reservation_point_mismatch');
    if (rrows[0].user_id !== user_id) throw new Error('reservation_user_mismatch');
  }

  const session_id = uuidv4();
  const created_at = new Date();

  await pool.query(
    `INSERT INTO sessions (session_id, user_id, point_id, vehicle_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [session_id, user_id, point_id, vehicle_id || null, 'initiated', created_at]
  );

  // publish event (best-effort)
  try {
    await publish('session_events', {
      type: 'SESSION_INITIATED',
      timestamp: created_at.toISOString(),
      data: { session_id, point_id, user_id, vehicle_id, auth_method, reservation_id },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_INITIATED):', e?.message || e);
  }

  return { session_id, status: 'initiated' };
}

/**
 * Start session - transaction-safe
 * Accepts & uses normalized session id (forgiving if not strict UUID).
 */
async function startSession({ session_id, start_meter_wh }) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT status FROM sessions WHERE session_id = ? FOR UPDATE', [sid]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      throw new Error('session_not_found');
    }

    const currentStatus = rows[0].status;
    if (currentStatus !== 'initiated' && currentStatus !== 'paused') {
      await conn.rollback();
      throw new Error('invalid_session_status');
    }

    const started_at = new Date();
    await conn.query(
      'UPDATE sessions SET status = ?, start_meter_wh = ?, started_at = ? WHERE session_id = ?',
      ['charging', start_meter_wh || 0, started_at, sid]
    );

    await conn.commit();

    try {
      await publish('session_events', {
        type: 'SESSION_STARTED',
        timestamp: started_at.toISOString(),
        data: { session_id: sid, start_meter_wh },
      });
    } catch (e) {
      console.warn('⚠️ RabbitMQ publish failed (SESSION_STARTED):', e?.message || e);
    }

    return { session_id: sid, status: 'charging', started_at: started_at.toISOString() };
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Push meter reading - ensure session exists and (optionally) is charging
 * This version uses normalized session id (sid) and is forgiving about non-UUID ids.
 */
async function pushMeterReading(session_id, { timestamp, meter_wh, power_kw, soc }) {
  if (!session_id || typeof meter_wh === 'undefined') throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  // ensure meter_wh is a number (integer-ish)
  if (typeof meter_wh !== 'number' && !/^[0-9]+$/.test(String(meter_wh))) throw new Error('invalid_meter_wh');

  const [rows] = await pool.query('SELECT status FROM sessions WHERE session_id = ? LIMIT 1', [sid]);
  if (!rows || rows.length === 0) throw new Error('session_not_found');

  const status = rows[0].status;
  if (status !== 'charging' && status !== 'paused') throw new Error('invalid_session_status_for_meter');

  const tsSql = toSqlDatetime(timestamp || new Date());

  await pool.query(
    'INSERT INTO telemetry (session_id, `timestamp`, meter_wh, power_kw, soc) VALUES (?, ?, ?, ?, ?)',
    [sid, tsSql, meter_wh, typeof power_kw === 'number' ? power_kw : null, typeof soc === 'number' ? soc : null]
  );

  try {
    await publish('telemetry_events', {
      type: 'METER_READING',
      timestamp: new Date(tsSql + 'Z').toISOString(),
      data: { session_id: sid, meter_wh, power_kw, soc },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (METER_READING):', e?.message || e);
  }

  return { status: 'ok' };
}

/**
 * Get telemetry - ensure session exists and return { telemetry: [...] }
 */
async function getTelemetry(session_id, from, to, limit = 100) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  limit = Number(limit) || 100;
  if (!Number.isInteger(limit) || limit <= 0) throw new Error('invalid_limit');
  const MAX_LIMIT = 5000;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const [srows] = await pool.query('SELECT 1 FROM sessions WHERE session_id = ? LIMIT 1', [sid]);
  if (!srows || srows.length === 0) throw new Error('session_not_found');

  let q = 'SELECT `timestamp` as time, meter_wh, power_kw, soc FROM telemetry WHERE session_id = ?';
  const params = [sid];
  if (from) {
    q += ' AND `timestamp` >= ?';
    params.push(toSqlDatetime(from));
  }
  if (to) {
    q += ' AND `timestamp` <= ?';
    params.push(toSqlDatetime(to));
  }
  q += ' ORDER BY `timestamp` ASC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(q, params);
  const telemetry = (rows || []).map(r => ({
    time: new Date(r.time).toISOString(),
    meter_wh: r.meter_wh,
    power_kw: r.power_kw,
    soc: r.soc,
  }));

  return { telemetry };
}

/**
 * Pause session
 */
async function pauseSession(session_id) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const [rows] = await pool.query('SELECT status FROM sessions WHERE session_id = ? LIMIT 1', [sid]);
  if (!rows || rows.length === 0) throw new Error('session_not_found');

  if (rows[0].status === 'paused') return { session_id: sid, status: 'paused', note: 'already paused' };
  if (rows[0].status !== 'charging') throw new Error('invalid_session_status_for_pause');

  await pool.query('UPDATE sessions SET status = ? WHERE session_id = ?', ['paused', sid]);

  try {
    await publish('session_events', {
      type: 'SESSION_PAUSED',
      timestamp: new Date().toISOString(),
      data: { session_id: sid },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_PAUSED):', e?.message || e);
  }

  return { session_id: sid, status: 'paused' };
}

/**
 * Resume session
 */
async function resumeSession(session_id) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const [rows] = await pool.query('SELECT status FROM sessions WHERE session_id = ? LIMIT 1', [sid]);
  if (!rows || rows.length === 0) throw new Error('session_not_found');

  if (rows[0].status !== 'paused') throw new Error('invalid_session_status_for_resume');

  await pool.query('UPDATE sessions SET status = ? WHERE session_id = ?', ['charging', sid]);

  try {
    await publish('session_events', {
      type: 'SESSION_RESUMED',
      timestamp: new Date().toISOString(),
      data: { session_id: sid },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_RESUMED):', e?.message || e);
  }

  return { session_id: sid, status: 'charging' };
}

/**
 * Stop session - transaction-safe and compute kWh/cost
 */
async function stopSession(session_id, { stop_reason, end_meter_wh }) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [srows] = await conn.query('SELECT start_meter_wh, status FROM sessions WHERE session_id = ? FOR UPDATE', [sid]);
    if (!srows || srows.length === 0) {
      await conn.rollback();
      throw new Error('session_not_found');
    }

    const curr = srows[0];
    if (!['charging', 'paused', 'initiated'].includes(curr.status)) {
      await conn.rollback();
      throw new Error('invalid_session_status_for_stop');
    }

    const start_meter_wh = curr.start_meter_wh || 0;
    const end = typeof end_meter_wh === 'number' ? end_meter_wh : null;
    const kwh = end != null ? ((end - start_meter_wh) / 1000.0) : 0;
    const rate = Number(process.env.RATE_PER_KWH || 20000);
    const cost = kwh > 0 ? Math.round(kwh * rate) : 0;
    const ended_at = new Date();

    await conn.query(
      'UPDATE sessions SET status = ?, end_meter_wh = ?, ended_at = ?, kwh = ?, cost = ? WHERE session_id = ?',
      ['finished', end, ended_at, kwh, cost, sid]
    );

    await conn.commit();

    try {
      await publish('session_events', {
        type: 'SESSION_FINISHED',
        timestamp: ended_at.toISOString(),
        data: { session_id: sid, kwh, cost, stop_reason },
      });

      await publish('notification_events', {
        type: 'NOTIFY_USER',
        data: {
          title: 'Charging Complete',
          message: `Your charging session ${sid} has finished. Total cost: ${cost} VND`,
        },
      });
    } catch (e) {
      console.warn('⚠️ RabbitMQ publish failed (SESSION_FINISHED):', e?.message || e);
    }

    return { session_id: sid, status: 'finished', kwh: Number(kwh.toFixed(3)), cost };
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get session detail
 */
async function getSession(session_id) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1', [sid]);
  if (!rows || rows.length === 0) throw new Error('session_not_found');

  const s = rows[0];
  if (s.started_at) s.started_at = new Date(s.started_at).toISOString();
  if (s.ended_at) s.ended_at = new Date(s.ended_at).toISOString();
  if (s.created_at) s.created_at = new Date(s.created_at).toISOString();
  return s;
}

/**
 * Get events history
 */
async function getEvents(session_id) {
  if (!session_id) throw new Error('missing_params');

  const { id: sid } = normalizeSessionId(session_id);
  if (!sid) throw new Error('missing_params');

  const [rows] = await pool.query(
    'SELECT started_at, ended_at FROM sessions WHERE session_id = ? LIMIT 1',
    [sid]
  );

  if (!rows || rows.length === 0) throw new Error('session_not_found');

  const s = rows[0];
  const events = [];
  if (s.started_at) events.push({ type: 'start', ts: new Date(s.started_at).toISOString() });
  if (s.ended_at) events.push({ type: 'stop', ts: new Date(s.ended_at).toISOString() });
  return { events };
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
  getEvents,
};
