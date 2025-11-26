// services/sessionRepository.js
const pool = require('../config/db');
const dayjs = require('dayjs');

class SessionRepository {
  /**
   * Tạo session mới (trạng thái initiated)
   * session object expected keys: session_id, reservation_id, station_id, point_id, user_id,
   * start_meter_wh, end_meter_wh, started_at, ended_at, status, created_at, updated_at
   */
  async create(session) {
    if (!session) throw new Error('Missing session object');
    if (!session.session_id) throw new Error('session.session_id is required');
    if (!session.user_id) throw new Error('session.user_id is required');
    if (!session.point_id) throw new Error('session.point_id is required');

    const q = `
      INSERT INTO sessions
        (session_id, reservation_id, station_id, point_id, user_id,
         start_meter_wh, end_meter_wh, started_at, ended_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const createdAt = session.created_at || dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
    const updatedAt = session.updated_at || dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    const values = [
      session.session_id,
      session.reservation_id || null,
      session.station_id || null,
      session.point_id,
      session.user_id,
      session.start_meter_wh != null ? session.start_meter_wh : null,
      session.end_meter_wh != null ? session.end_meter_wh : null,
      session.started_at || null,
      session.ended_at || null,
      session.status || 'initiated',
      createdAt,
      updatedAt,
    ];

    await pool.query(q, values);

    // Trả về bản ghi thực tế từ DB để đảm bảo consistent và kiểu dữ liệu chính xác
    return this.getById(session.session_id);
  }

  async getById(session_id) {
    if (!session_id) throw new Error('session_id is required');
    const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    if (!rows || !rows.length) return null;
    const r = rows[0];
    // Normalize metadata nếu cần
    try {
      r.metadata = r.metadata ? (typeof r.metadata === 'object' ? r.metadata : JSON.parse(r.metadata)) : null;
    } catch (e) {
      r.metadata = null;
    }
    return r;
  }

  /**
   * Cập nhật bất kỳ trường nào cần thiết (status + extras)
   * extra: object các trường bổ sung: start_meter_wh, end_meter_wh, started_at, ended_at, cost
   *
   * IMPORTANT: sử dụng hasOwnProperty để cho phép caller truyền value = 0 hay empty string
   */
  async updateStatus(session_id, status, extra = {}) {
    if (!session_id) throw new Error('session_id is required');
    if (!status) throw new Error('status is required');

    const sets = [];
    const vals = [];

    sets.push('status = ?'); vals.push(status);

    // presence checks (hasOwnProperty) để cho phép giá trị 0
    if (Object.prototype.hasOwnProperty.call(extra, 'start_meter_wh') && extra.start_meter_wh != null) {
      sets.push('start_meter_wh = ?'); vals.push(extra.start_meter_wh);
    }
    if (Object.prototype.hasOwnProperty.call(extra, 'end_meter_wh') && extra.end_meter_wh != null) {
      sets.push('end_meter_wh = ?'); vals.push(extra.end_meter_wh);
    }
    if (Object.prototype.hasOwnProperty.call(extra, 'started_at') && extra.started_at != null) {
      sets.push('started_at = ?'); vals.push(extra.started_at);
    }
    if (Object.prototype.hasOwnProperty.call(extra, 'ended_at') && extra.ended_at != null) {
      sets.push('ended_at = ?'); vals.push(extra.ended_at);
    }

    // NOTE: kwh là generated column (không set ở đây)

    if (Object.prototype.hasOwnProperty.call(extra, 'cost') && extra.cost != null) {
      sets.push('cost = ?'); vals.push(extra.cost);
    }

    // luôn cập nhật updated_at
    sets.push('updated_at = ?'); vals.push(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));

    const q = `UPDATE sessions SET ${sets.join(', ')} WHERE session_id = ?`;
    vals.push(session_id);

    await pool.query(q, vals);

    return this.getById(session_id);
  }

  /**
   * Lấy lịch sử session của 1 user (chronological desc)
   * opts: { from, to, limit = 100, offset = 0, status }
   */
  async getByUserId(user_id, { from = null, to = null, limit = 100, offset = 0, status = null } = {}) {
    if (!user_id) throw new Error('user_id is required');

    const vals = [user_id];
    let q = `SELECT * FROM sessions WHERE user_id = ?`;

    if (status) {
      q += ` AND status = ?`;
      vals.push(status);
    }

    if (from) {
      q += ` AND started_at >= ?`;
      vals.push(from);
    }
    if (to) {
      q += ` AND ended_at <= ?`;
      vals.push(to);
    }

    q += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    vals.push(Number(limit) || 100, Number(offset) || 0);

    const [rows] = await pool.query(q, vals);

    return rows.map(r => {
      const copy = { ...r };
      try {
        copy.metadata = copy.metadata ? (typeof copy.metadata === 'object' ? copy.metadata : JSON.parse(copy.metadata)) : null;
      } catch (e) {
        copy.metadata = null;
      }
      return copy;
    });
  }

  /**
   * Lấy tất cả điểm đang active (status = 'charging' hoặc 'pending') cho một station
   * Trả về list các điểm: { session_id, point_id, user_id, started_at, status, metadata }
   */
  async getActiveByStationId(station_id) {
    if (!station_id) throw new Error('station_id is required');

    const q = `
      SELECT session_id, point_id, user_id, started_at,started_at, status, metadata
      FROM sessions
      WHERE station_id = ? AND LOWER(status) IN ('charging', 'pending','confirmed')
      ORDER BY started_at ASC
    `;

    const [rows] = await pool.query(q, [station_id]);

    return rows.map(r => {
      const copy = { ...r };
      try {
        copy.metadata = copy.metadata ? (typeof copy.metadata === 'object' ? copy.metadata : JSON.parse(copy.metadata)) : null;
      } catch (e) {
        copy.metadata = null;
      }
      return copy;
    });
  }

  async exists(session_id) {
    if (!session_id) throw new Error('session_id is required');
    const [rows] = await pool.query('SELECT 1 FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    return Array.isArray(rows) && rows.length > 0;
  }

  async getEvents(session_id) {
    if (!session_id) throw new Error('session_id is required');
    const [rows] = await pool.query('SELECT started_at, ended_at FROM sessions WHERE session_id = ? LIMIT 1', [session_id]);
    if (!rows.length) return [];
    const r = rows[0];
    const events = [];
    if (r.started_at) events.push({ type: 'start', ts: new Date(r.started_at).toISOString() });
    if (r.ended_at)   events.push({ type: 'stop',  ts: new Date(r.ended_at).toISOString() });
    return events;
  }
}

module.exports = new SessionRepository();
