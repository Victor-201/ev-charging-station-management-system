// reservationService.js
const pool = require('../db'); // mysql2/promise pool
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { publish } = require('../rabbit');

const RES_EXP_MIN = Number(process.env.RESERVATION_EXPIRE_MIN || 10);

/**
 * Helper: format to SQL datetime (UTC)
 */
function toSqlDatetimeIsoZ(input) {
  return dayjs(input).utc().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Kiểm tra xem trạm sạc (point_id) có khả dụng trong khoảng thời gian không
 * start_time & end_time nên được truyền ở dạng ISO string hoặc Date; hàm sẽ format.
 */
// ✅ 1. Kiểm tra khả dụng
function toSqlDatetimeIsoZ(input) {
  return dayjs(input).utc().format('YYYY-MM-DD HH:mm:ss');
}

async function checkAvailability(station_id, point_id, start_time, end_time) {
  if (!station_id || !point_id || !start_time || !end_time) {
    return { ok: false, reason: 'missing_params' };
  }

  const start = toSqlDatetimeIsoZ(start_time);
  const end = toSqlDatetimeIsoZ(end_time);

  // Kiểm tra xem có bản ghi nào trùng toàn bộ không
  const q = `
    SELECT COUNT(*) AS cnt 
    FROM reservations 
    WHERE station_id = ? 
      AND point_id = ? 
      AND start_time = ? 
      AND end_time = ? 
      AND status = 'confirmed'
  `;

  const [rows] = await pool.query(q, [station_id, point_id, start, end]);

  // Nếu trùng thì true, không trùng thì false
  const available = rows[0].cnt > 0;

  return { ok: true, available };
}

module.exports = { checkAvailability };

/**
 * Tạo mới đặt chỗ
 * payload: { user_id, station_id, point_id, connector_type, start_time, end_time }
 */
async function createReservation(payload) {
  // basic validation
  if (!payload || !payload.user_id || !payload.station_id || !payload.point_id || !payload.connector_type || !payload.start_time || !payload.end_time) {
    return { ok: false, reason: 'invalid_payload' };
  }

  // validate times
  const startFormatted = toSqlDatetimeIsoZ(payload.start_time);
  const endFormatted = toSqlDatetimeIsoZ(payload.end_time);
  if (!dayjs(startFormatted).isValid() || !dayjs(endFormatted).isValid() || !dayjs(endFormatted).isAfter(dayjs(startFormatted))) {
    return { ok: false, reason: 'invalid_time_range' };
  }

  const conn = await pool.getConnection();
  const lockName = `point_lock_${payload.point_id}`;

  try {
    await conn.beginTransaction();

    // GET_LOCK wait up to 5 seconds
    const [lkRows] = await conn.query('SELECT GET_LOCK(?, 5) AS lk', [lockName]);
    if (!lkRows || lkRows.length === 0 || lkRows[0].lk !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'could_not_lock' };
    }

    // Kiểm tra trùng lịch sử dụng cùng format thời gian
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM reservations
       WHERE point_id = ? AND status = 'confirmed'
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [payload.point_id, startFormatted, endFormatted]
    );

    if (rows[0].cnt > 0) {
      // release lock then rollback
      try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
      await conn.rollback();
      return { ok: false, reason: 'point_not_available' };
    }

    const reservation_id = uuidv4();
    const expires_at = dayjs().utc().add(RES_EXP_MIN, 'minute').format('YYYY-MM-DD HH:mm:ss');

    // Insert reservation
    await conn.query(
      `INSERT INTO reservations
        (reservation_id, user_id, station_id, point_id, connector_type, start_time, end_time, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        reservation_id,
        payload.user_id,
        payload.station_id,
        payload.point_id,
        payload.connector_type,
        startFormatted,
        endFormatted,
        expires_at
      ]
    );

    await conn.commit();

    // release lock (best-effort)
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}

    // Publish events (non-fatal)
    (async () => {
      try {
        await publish('reservation_events', {
          type: 'RESERVATION_CREATED',
          timestamp: new Date().toISOString(),
          data: {
            reservation_id,
            user_id: payload.user_id,
            station_id: payload.station_id,
            point_id: payload.point_id,
            start_time: startFormatted,
            end_time: endFormatted,
          },
        });

        await publish('notification_events', {
          type: 'NOTIFY_USER',
          data: {
            to_user: payload.user_id,
            title: 'Reservation Confirmed',
            message: `Your reservation ${reservation_id} has been confirmed.`,
          },
        });
      } catch (e) {
        console.warn('⚠️ RabbitMQ publish failed (non-fatal):', e && e.message ? e.message : e);
      }
    })();

    // trả expires_at ở dạng ISOZ để dễ dùng client-side
    return { ok: true, reservation_id, status: 'confirmed', expires_at: dayjs(expires_at).utc().toISOString() };
  } catch (e) {
    // đảm bảo release lock & rollback nếu có lỗi
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Error in createReservation:', e);
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Lấy thông tin chi tiết đặt chỗ theo ID
 */
async function getReservationById(reservation_id) {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ?', [reservation_id]);
  if (!rows || rows.length === 0) return null;
  // convert datetime fields to ISOZ for consistency
  const r = { ...rows[0] };
  if (r.start_time) r.start_time = dayjs(r.start_time).utc().toISOString();
  if (r.end_time) r.end_time = dayjs(r.end_time).utc().toISOString();
  if (r.expires_at) r.expires_at = dayjs(r.expires_at).utc().toISOString();
  return r;
}

/**
 * Cập nhật thời gian đặt chỗ
 */
async function updateReservation(reservation_id, start_time, end_time) {
  if (!start_time || !end_time) return { ok: false, reason: 'invalid_time' };

  const startFormatted = toSqlDatetimeIsoZ(start_time);
  const endFormatted = toSqlDatetimeIsoZ(end_time);
  if (!dayjs(endFormatted).isAfter(dayjs(startFormatted))) return { ok: false, reason: 'invalid_time_range' };

  const conn = await pool.getConnection();
  const lockName = `reservation_update_${reservation_id}`;

  try {
    await conn.beginTransaction();

    const [lkRows] = await conn.query('SELECT GET_LOCK(?, 5) AS lk', [lockName]);
    if (!lkRows || lkRows.length === 0 || lkRows[0].lk !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'could_not_lock' };
    }

    const [resRows] = await conn.query('SELECT point_id FROM reservations WHERE reservation_id = ?', [reservation_id]);
    if (!resRows || resRows.length === 0) {
      try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
      await conn.rollback();
      return { ok: false, reason: 'not_found' };
    }
    const point_id = resRows[0].point_id;

    const [confRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM reservations
       WHERE point_id = ? AND status = 'confirmed'
       AND reservation_id <> ?
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [point_id, reservation_id, startFormatted, endFormatted]
    );

    if (confRows[0].cnt > 0) {
      try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
      await conn.rollback();
      return { ok: false, reason: 'conflict' };
    }

    await conn.query('UPDATE reservations SET start_time = ?, end_time = ? WHERE reservation_id = ?', [startFormatted, endFormatted, reservation_id]);

    await conn.commit();
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}

    // publish event (non-fatal)
    (async () => {
      try {
        await publish('reservation_events', {
          type: 'RESERVATION_UPDATED',
          timestamp: new Date().toISOString(),
          data: { reservation_id, start_time: startFormatted, end_time: endFormatted }
        });
      } catch (e) {
        console.warn('⚠️ RabbitMQ publish failed:', e && e.message ? e.message : e);
      }
    })();

    return { ok: true, status: 'updated' };
  } catch (e) {
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Error in updateReservation:', e);
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Hủy đặt chỗ
 */
async function cancelReservation(reservation_id) {
  // mark cancelled
  await pool.query('UPDATE reservations SET status = ? WHERE reservation_id = ?', ['cancelled', reservation_id]);

  // create notification record (best-effort)
  const notifId = uuidv4();
  try {
    await pool.query(
      'INSERT INTO notifications (id, to_user, channels, title, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [notifId, null, JSON.stringify([]), 'Reservation Cancelled', `Reservation ${reservation_id} cancelled`, 'queued']
    );
  } catch (e) {
    console.warn('⚠️ Insert notification failed:', e && e.message ? e.message : e);
  }

  try {
    await publish('reservation_events', { type: 'RESERVATION_CANCELLED', timestamp: new Date().toISOString(), data: { reservation_id } });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed:', e && e.message ? e.message : e);
  }

  return { reservation_id, status: 'cancelled', refund_policy: 'partial' };
}

/**
 * Thêm người dùng vào danh sách chờ (waitlist)
 */
async function addToWaitlist({ user_id, station_id, connector_type }) {
  if (!user_id || !station_id || !connector_type) return { ok: false, reason: 'invalid_payload' };

  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM waitlist WHERE station_id = ? AND connector_type = ?', [station_id, connector_type]);
  const position = (rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0) + 1;
  const waitlist_id = uuidv4();

  await pool.query('INSERT INTO waitlist (waitlist_id, user_id, station_id, connector_type, position) VALUES (?, ?, ?, ?, ?)', [waitlist_id, user_id, station_id, connector_type, position]);

  try {
    await publish('waitlist_events', { type: 'WAITLIST_JOINED', data: { waitlist_id, user_id, station_id, connector_type, position } });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed:', e && e.message ? e.message : e);
  }

  return { waitlist_id, position };
}

/**
 * Lấy tất cả reservation của user
 */
async function getUserReservations(user_id) {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE user_id = ?', [user_id]);
  // convert datetimes to ISOZ
  return (rows || []).map(r => {
    const copy = { ...r };
    if (copy.start_time) copy.start_time = dayjs(copy.start_time).utc().toISOString();
    if (copy.end_time) copy.end_time = dayjs(copy.end_time).utc().toISOString();
    if (copy.expires_at) copy.expires_at = dayjs(copy.expires_at).utc().toISOString();
    return copy;
  });
}

/**
 * Tự động hủy các đặt chỗ quá hạn (sau 20 phút kể từ start_time mà chưa bắt đầu sạc)
 * Trả về danh sách reservation_id đã hủy
 */
async function autoCancelLateReservations() {
  const now = dayjs().utc();
  const twentyMinutesAgo = now.subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss');

  const [rows] = await pool.query(`
    SELECT reservation_id, user_id, start_time
    FROM reservations
    WHERE status = 'confirmed'
      AND start_time < ?
  `, [twentyMinutesAgo]);

  if (!rows || rows.length === 0) return { cancelled: 0, list: [] };

  const cancelledList = [];

  for (const res of rows) {
    try {
      await pool.query('UPDATE reservations SET status = ? WHERE reservation_id = ?', ['cancelled', res.reservation_id]);

      const notifId = uuidv4();
      await pool.query(
        'INSERT INTO notifications (id, to_user, channels, title, message, status) VALUES (?, ?, ?, ?, ?, ?)',
        [notifId, res.user_id, JSON.stringify(['app']), 'Reservation Auto-Cancelled', `Your reservation ${res.reservation_id} was automatically cancelled because you did not start charging within 20 minutes.`, 'queued']
      );

      try {
        await publish('notification_events', { type: 'NOTIFY_USER', data: { to_user: res.user_id, title: 'Reservation Auto-Cancelled', message: `Your reservation ${res.reservation_id} was cancelled automatically due to inactivity.` } });
        await publish('reservation_events', { type: 'RESERVATION_AUTO_CANCELLED', timestamp: new Date().toISOString(), data: { reservation_id: res.reservation_id, user_id: res.user_id } });
      } catch (err) {
        console.warn('⚠️ RabbitMQ publish failed for auto cancel:', err && err.message ? err.message : err);
      }

      cancelledList.push(res.reservation_id);
    } catch (e) {
      console.error('❌ autoCancel error for', res.reservation_id, e);
    }
  }

  return { cancelled: cancelledList.length, list: cancelledList };
}

module.exports = {
  checkAvailability,
  createReservation,
  getReservationById,
  updateReservation,
  cancelReservation,
  addToWaitlist,
  getUserReservations,
  autoCancelLateReservations,
};
