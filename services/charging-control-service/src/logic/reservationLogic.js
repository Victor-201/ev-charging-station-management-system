const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { publish } = require('../rabbit'); // 🔥 Thêm dòng này để dùng RabbitMQ

const RES_EXP_MIN = Number(process.env.RESERVATION_EXPIRE_MIN || 10);

async function checkAvailability(station_id, point_id, start_time, end_time) {
  const q = `SELECT COUNT(*) AS cnt FROM reservations
    WHERE point_id = ? AND status = 'confirmed' AND NOT (end_time <= ? OR start_time >= ?)`;
  const [rows] = await pool.query(q, [point_id, start_time, end_time]);
  return rows[0].cnt === 0;
}

async function createReservation(payload) {
  const conn = await pool.getConnection();
  const lockName = `point_lock_${payload.point_id}`;
  try {
    await conn.beginTransaction();

    // Lấy lock theo point_id
    const [lk] = await conn.query('SELECT GET_LOCK(?, 5) as lk', [lockName]);
    if (!lk || lk[0].lk !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'could_not_lock' };
    }

    // Kiểm tra trùng lịch
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM reservations 
       WHERE point_id = ? AND status = 'confirmed' 
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [payload.point_id, payload.start_time, payload.end_time]
    );
    if (rows[0].cnt > 0) {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
      await conn.rollback();
      return { ok: false, reason: 'Point not available' };
    }

    // Tạo mới
        // Format datetime để MySQL không lỗi
    const start_time = dayjs(payload.start_time).utc().format('YYYY-MM-DD HH:mm:ss');
    const end_time = dayjs(payload.end_time).utc().format('YYYY-MM-DD HH:mm:ss');
    const expires_at = dayjs().add(RES_EXP_MIN, 'minute').utc().format('YYYY-MM-DD HH:mm:ss');

    // Tạo mới
    const reservation_id = uuidv4();

    await conn.query(
      `INSERT INTO reservations (reservation_id, user_id, station_id, point_id, connector_type, start_time, end_time, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        reservation_id,
        payload.user_id,
        payload.station_id,
        payload.point_id,
        payload.connector_type,
        start_time,
        end_time,
        expires_at
      ]
    );


    await conn.commit();
    await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);

    // 📨 Publish event tới RabbitMQ
    try {
      await publish('reservation_events', {
        type: 'RESERVATION_CREATED',
        timestamp: new Date().toISOString(),
        data: {
          reservation_id,
          user_id: payload.user_id,
          station_id: payload.station_id,
          point_id: payload.point_id,
          start_time: payload.start_time,
          end_time: payload.end_time
        }
      });

      await publish('notification_events', {
        type: 'NOTIFY_USER',
        data: {
          to_user: payload.user_id,
          title: 'Reservation Confirmed',
          message: `Your reservation ${reservation_id} is confirmed.`,
        },
      });
    } catch (e) {
      console.warn('⚠️ RabbitMQ publish failed (non-fatal):', e.message);
    }

    return { ok: true, reservation_id, status: 'confirmed', expires_at };
  } catch (e) {
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function getReservationById(reservation_id) {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ?', [reservation_id]);
  return rows[0] || null;
}

async function updateReservation(reservation_id, start_time, end_time) {
  const conn = await pool.getConnection();
  const lockName = `reservation_update_${reservation_id}`;
  try {
    await conn.beginTransaction();

    // Lấy lock để tránh race condition
    const [lk] = await conn.query('SELECT GET_LOCK(?, 5) as lk', [lockName]);
    if (!lk || lk[0].lk !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'could_not_lock' };
    }

    // Lấy reservation hiện tại
    const [resRows] = await conn.query(
      'SELECT point_id FROM reservations WHERE reservation_id = ?',
      [reservation_id]
    );
    if (resRows.length === 0) {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
      await conn.rollback();
      return { ok: false, reason: 'not_found' };
    }
    const point_id = resRows[0].point_id;

    // Log debug
    console.log('Existing reservation row:', resRows);

    // Format thời gian sang MySQL DATETIME hợp lệ
    const start_time_formatted = dayjs(start_time).utc().format('YYYY-MM-DD HH:mm:ss');
    const end_time_formatted = dayjs(end_time).utc().format('YYYY-MM-DD HH:mm:ss');

    // Kiểm tra trùng lịch
    const [confRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM reservations 
       WHERE point_id = ? AND status = 'confirmed' 
       AND reservation_id <> ? 
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [point_id, reservation_id, start_time_formatted, end_time_formatted]
    );
    console.log('Conflict rows:', confRows);

    if (confRows[0].cnt > 0) {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
      await conn.rollback();
      return { ok: false, reason: 'Conflict with other reservations' };
    }

    // Update reservation
    await conn.query(
      'UPDATE reservations SET start_time = ?, end_time = ? WHERE reservation_id = ?',
      [start_time_formatted, end_time_formatted, reservation_id]
    );

    await conn.commit();
    await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);

    // Publish event (non-blocking)
    try {
      await publish('reservation_events', {
        type: 'RESERVATION_UPDATED',
        timestamp: new Date().toISOString(),
        data: {
          reservation_id,
          start_time: start_time_formatted,
          end_time: end_time_formatted,
        },
      });
    } catch (e) {
      console.warn('⚠️ RabbitMQ publish failed:', e.message);
    }

    return { ok: true, status: 'updated' };
  } catch (e) {
    try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch (_) {}
    await conn.rollback();
    console.error('Error in logic.updateReservation:', e);
    throw e;
  } finally {
    conn.release();
  }
}


async function cancelReservation(reservation_id) {
  await pool.query('UPDATE reservations SET status = ? WHERE reservation_id = ?', ['cancelled', reservation_id]);

  const notifId = uuidv4();
  await pool.query(
    'INSERT INTO notifications (id, to_user, channels, title, message, status) VALUES (?, ?, ?, ?, ?, ?)',
    [
      notifId,
      null,
      JSON.stringify([]),
      'Reservation Cancelled',
      `Reservation ${reservation_id} cancelled`,
      'queued',
    ]
  );

  // 📨 Publish event cancel
  try {
    await publish('reservation_events', {
      type: 'RESERVATION_CANCELLED',
      timestamp: new Date().toISOString(),
      data: { reservation_id },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed:', e.message);
  }

  return { reservation_id, status: 'cancelled', refund_policy: 'partial' };
}

async function addToWaitlist({ user_id, station_id, connector_type }) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM waitlist WHERE station_id = ? AND connector_type = ?',
    [station_id, connector_type]
  );
  const position = rows[0].cnt + 1;
  const waitlist_id = uuidv4();

  await pool.query(
    'INSERT INTO waitlist (waitlist_id, user_id, station_id, connector_type, position) VALUES (?, ?, ?, ?, ?)',
    [waitlist_id, user_id, station_id, connector_type, position]
  );

  // 📨 Publish event join waitlist
  try {
    await publish('waitlist_events', {
      type: 'WAITLIST_JOINED',
      data: { waitlist_id, user_id, station_id, connector_type, position },
    });
  } catch (e) {
    console.warn('⚠️ RabbitMQ publish failed:', e.message);
  }

  return { waitlist_id, position };
}

async function getUserReservations(user_id) {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE user_id = ?', [user_id]);
  return rows;
}

module.exports = {
  checkAvailability,
  createReservation,
  getReservationById,
  updateReservation,
  cancelReservation,
  addToWaitlist,
  getUserReservations,
};
