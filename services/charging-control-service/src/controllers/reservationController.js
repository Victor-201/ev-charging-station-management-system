const db = require('../db'); // file kết nối MySQL
const logic = require('../logic/reservationLogic');
const { autoCancelLateReservations } = require('../logic/reservationLogic');

async function existsInDB(table, column, value) {
  const [rows] = await db.query(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  return rows.length > 0;
}

// ✅ 1. Kiểm tra khả dụng
async function checkAvailability(req, res) {
  try {
    const data = { ...req.query, ...req.body };
    const { station_id, point_id, start_time, end_time } = data;

    if (!station_id || !point_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'missing params' });
    }

    const result = await logic.checkAvailability(station_id, point_id, start_time, end_time);

    if (!result.ok) {
      return res.status(400).json({ error: result.reason || 'bad_request' });
    }

    return res.json({ available: result.available });
  } catch (e) {
    console.error('❌ checkAvailabilityController error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 2. Tạo đặt chỗ mới
async function createReservation(req, res) {
  try {
    const { user_id, station_id, point_id, connector_type, start_time, end_time } = req.body;

    const needed = ['user_id', 'station_id', 'point_id', 'connector_type', 'start_time', 'end_time'];
    for (const key of needed) {
      if (!req.body[key]) return res.status(400).json({ error: `missing ${key}` });
    }

    const userExists = await existsInDB('users', 'user_id', user_id);
    const stationExists = await existsInDB('stations', 'station_id', station_id);
    const pointExists = await existsInDB('points', 'point_id', point_id);

    if (!userExists || !stationExists || !pointExists)
      return res.status(404).json({ error: 'invalid user/station/point' });

    const result = await logic.createReservation(req.body);
    if (!result.ok) return res.status(400).json({ error: result.reason });

    return res.json({
      reservation_id: result.reservation_id,
      status: result.status,
      expires_at: result.expires_at,
    });
  } catch (e) {
    console.error('❌ createReservation error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 3. Lấy chi tiết đặt chỗ
async function getReservationById(req, res) {
  try {
    const reservation_id = req.params.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'missing reservation_id' });

    const r = await logic.getReservationById(reservation_id);
    if (!r) return res.status(404).json({ error: 'not found' });

    return res.json({
      reservation_id: r.reservation_id,
      status: r.status,
      ...r,
    });
  } catch (e) {
    console.error('❌ getReservationById error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 4. Cập nhật đặt chỗ
async function updateReservation(req, res) {
  try {
    const reservation_id = req.params.reservation_id;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time)
      return res.status(400).json({ error: 'missing start_time or end_time' });

    const exists = await existsInDB('reservations', 'reservation_id', reservation_id);
    if (!exists) return res.status(404).json({ error: 'reservation not found' });

    const result = await logic.updateReservation(reservation_id, start_time, end_time);
    if (!result.ok) {
      if (result.reason === 'Conflict with other reservations')
        return res.status(409).json({ error: result.reason });
      return res.status(400).json({ error: result.reason });
    }

    return res.json({
      reservation_id,
      status: 'updated',
    });
  } catch (e) {
    console.error('❌ updateReservation error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 5. Hủy đặt chỗ
async function cancelReservation(req, res) {
  try {
    const reservation_id = req.params.reservation_id;

    const exists = await existsInDB('reservations', 'reservation_id', reservation_id);
    if (!exists) return res.status(404).json({ error: 'reservation not found' });

    const result = await logic.cancelReservation(reservation_id);
    return res.json({
      reservation_id,
      status: 'cancelled',
      refund_policy: result.refund_policy || 'partial',
    });
  } catch (e) {
    console.error('❌ cancelReservation error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 6. Thêm vào danh sách chờ
async function addToWaitlist(req, res) {
  try {
    const { user_id, station_id, connector_type } = req.body;
    if (!user_id || !station_id || !connector_type)
      return res.status(400).json({ error: 'missing fields' });

    const userExists = await existsInDB('users', 'user_id', user_id);
    const stationExists = await existsInDB('stations', 'station_id', station_id);

    if (!userExists || !stationExists)
      return res.status(404).json({ error: 'invalid user or station' });

    const r = await logic.addToWaitlist({ user_id, station_id, connector_type });
    return res.json({
      waitlist_id: r.waitlist_id,
      position: r.position,
    });
  } catch (e) {
    console.error('❌ addToWaitlist error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 7. Lấy danh sách đặt chỗ của user
async function getUserReservations(req, res) {
  try {
    const user_id = req.params.user_id;
    if (!user_id) return res.status(400).json({ error: 'missing user_id' });

    const exists = await existsInDB('users', 'user_id', user_id);
    if (!exists) return res.status(404).json({ error: 'user not found' });

    const rows = await logic.getUserReservations(user_id);
    return res.json({ reservations: rows });
  } catch (e) {
    console.error('❌ getUserReservations error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

// ✅ 8. Tự động huỷ đặt chỗ trễ hạn
async function runAutoCancelJob(req, res) {
  try {
    const result = await autoCancelLateReservations();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('❌ Auto-cancel job failed:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = {
  checkAvailability,
  createReservation,
  getReservationById,
  updateReservation,
  cancelReservation,
  addToWaitlist,
  getUserReservations,
  runAutoCancelJob,
};
