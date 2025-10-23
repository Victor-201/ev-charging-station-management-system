const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const { publish } = require('../rabbit'); // 🔥 Dòng mới - để gửi event qua RabbitMQ
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

async function initiateSession({ point_id, user_id, vehicle_id, auth_method, reservation_id }) {
  const session_id = uuidv4();
  await pool.query(
    `INSERT INTO sessions (session_id, user_id, point_id, vehicle_id, status) VALUES (?, ?, ?, ?, ?)`,
    [session_id, user_id, point_id, vehicle_id || null, 'initiated']
  );

  // 📨 Gửi event khi tạo mới session
  try {
    await publish('session_events', {
      type: 'SESSION_INITIATED',
      timestamp: new Date().toISOString(),
      data: { session_id, point_id, user_id, vehicle_id, auth_method, reservation_id },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_INITIATED):', e.message);
  }

  return { session_id, status: 'initiated' };
}

async function startSession({ session_id, start_meter_wh }) {
  const started_at = new Date();
  await pool.query(
    'UPDATE sessions SET status = ?, start_meter_wh = ?, started_at = ? WHERE session_id = ?',
    ['charging', start_meter_wh || 0, started_at, session_id]
  );

  // 📨 Gửi event bắt đầu sạc
  try {
    await publish('session_events', {
      type: 'SESSION_STARTED',
      timestamp: started_at.toISOString(),
      data: { session_id, start_meter_wh },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_STARTED):', e.message);
  }

  return { session_id, status: 'charging', started_at: started_at.toISOString() };
}

async function pushMeterReading(session_id, { timestamp, meter_wh, power_kw, soc }) {
  const ts = dayjs(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');

  await pool.query(
    'INSERT INTO telemetry (session_id, timestamp, meter_wh, power_kw, soc) VALUES (?, ?, ?, ?, ?)',
    [session_id, ts, meter_wh, power_kw || null, soc || null]
  );

  try {
    await publish('telemetry_events', {
      type: 'METER_READING',
      timestamp: ts,
      data: { session_id, meter_wh, power_kw, soc },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (METER_READING):', e.message);
  }

  return { status: 'ok' };
}
async function getTelemetry(session_id, from, to, limit = 100) {
  let q = 'SELECT timestamp as time, meter_wh, power_kw, soc FROM telemetry WHERE session_id = ?';
  const params = [session_id];
  if (from) {
    q += ' AND timestamp >= ?';
    params.push(from);
  }
  if (to) {
    q += ' AND timestamp <= ?';
    params.push(to);
  }
  q += ' ORDER BY timestamp ASC LIMIT ?';
  params.push(Number(limit));
  const [rows] = await pool.query(q, params);
  return rows;
}

async function pauseSession(session_id) {
  // Kiểm tra trạng thái hiện tại
  const [rows] = await pool.query('SELECT status FROM sessions WHERE session_id = ?', [session_id]);
  if (rows.length === 0) throw new Error('session not found');

  if (rows[0].status === 'paused') {
    return { session_id, status: 'paused', note: 'already paused' };
  }

  await pool.query('UPDATE sessions SET status = ? WHERE session_id = ?', ['paused', session_id]);

  try {
    await publish('session_events', {
      type: 'SESSION_PAUSED',
      timestamp: new Date().toISOString(),
      data: { session_id },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_PAUSED):', e.message);
  }

  return { session_id, status: 'paused' };
}


async function resumeSession(session_id) {
  await pool.query('UPDATE sessions SET status = ? WHERE session_id = ?', ['charging', session_id]);

  // 📨 Gửi event resume
  try {
    await publish('session_events', {
      type: 'SESSION_RESUMED',
      timestamp: new Date().toISOString(),
      data: { session_id },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_RESUMED):', e.message);
  }

  return { session_id, status: 'charging' };
}

async function stopSession(session_id, { stop_reason, end_meter_wh }) {
  const ended_at = new Date();

  // Lấy dữ liệu khởi tạo
  const [rows] = await pool.query('SELECT start_meter_wh FROM sessions WHERE session_id = ?', [session_id]);
  const start_meter_wh = rows && rows[0] ? (rows[0].start_meter_wh || 0) : 0;

  // Tính kWh và chi phí
  const kwh = ((end_meter_wh || 0) - (start_meter_wh || 0)) / 1000.0;
  const rate = Number(process.env.RATE_PER_KWH || 20000); // 20k VND/kWh mặc định
  const cost = kwh > 0 ? Math.round(kwh * rate) : 0;

  await pool.query(
    'UPDATE sessions SET status = ?, end_meter_wh = ?, ended_at = ?, kwh = ?, cost = ? WHERE session_id = ?',
    ['finished', end_meter_wh || null, ended_at, kwh, cost, session_id]
  );

  // 📨 Gửi event stop
  try {
    await publish('session_events', {
      type: 'SESSION_FINISHED',
      timestamp: ended_at.toISOString(),
      data: { session_id, kwh, cost, stop_reason },
    });

    await publish('notification_events', {
      type: 'NOTIFY_USER',
      data: {
        title: 'Charging Complete',
        message: `Your charging session ${session_id} has finished. Total cost: ${cost} VND`,
      },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed (SESSION_FINISHED):', e.message);
  }

  return { session_id, status: 'finished', kwh: Number(kwh.toFixed(3)), cost };
}

async function getSession(session_id) {
  const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ?', [session_id]);
  return rows[0] || null;
}

async function getEvents(session_id) {
  const [rows] = await pool.query(
    'SELECT started_at, ended_at FROM sessions WHERE session_id = ?',
    [session_id]
  );

  if (rows.length === 0) return { events: [] };

  const s = rows[0];
  const events = [];

  if (s.started_at) {
    events.push({ type: 'start', ts: new Date(s.started_at).toISOString() });
  }

  if (s.ended_at) {
    events.push({ type: 'stop', ts: new Date(s.ended_at).toISOString() });
  }

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
