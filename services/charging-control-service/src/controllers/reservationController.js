const logic = require('../logic/reservationLogic');

async function checkAvailability(req, res) {
  try {
    const { station_id, point_id, start_time, end_time } = req.body; // <-- body JSON
    if (!point_id || !start_time || !end_time)
      return res.status(400).json({ error: 'missing params' });

    const available = await logic.checkAvailability(station_id, point_id, start_time, end_time);
    return res.json({ available });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}


async function createReservation(req, res) {
  try {
    const payload = req.body;
    // validate required fields
    const needed = ['user_id','station_id','point_id','connector_type','start_time','end_time'];
    for (const k of needed) if (!payload[k]) return res.status(400).json({ error: `missing ${k}` });

    const result = await logic.createReservation(payload);
    if (!result.ok) return res.status(400).json({ error: result.reason });
    // Format response to match spec
    return res.json({
      reservation_id: result.reservation_id,
      status: result.status,
      expires_at: result.expires_at
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getReservationById(req, res) {
  try {
    console.log('req.url:', req.url);
    console.log('req.params:', req.params);
    const id = req.params.reservation_id;
    const r = await logic.getReservationById(id);
    console.log('DB result:', r);
    if (!r) return res.status(404).json({ error: 'not found' });
    return res.json({ reservation_id: r.reservation_id, status: r.status, ...r });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}


async function updateReservation(req, res) {
  try {
    const reservation_id = req.params.reservation_id;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'missing start_time or end_time' });
    }

    console.log('PUT update reservation_id:', reservation_id);
    console.log('Body:', req.body);

    const result = await logic.updateReservation(reservation_id, start_time, end_time);

    if (!result.ok) {
      if (result.reason === 'not_found') return res.status(404).json({ error: 'reservation not found' });
      if (result.reason === 'could_not_lock') return res.status(423).json({ error: 'resource locked, try again' });
      if (result.reason === 'Conflict with other reservations') return res.status(409).json({ error: result.reason });
      return res.status(400).json({ error: result.reason });
    }

    return res.json(result);
  } catch (e) {
    console.error('Error in updateReservation:', e);
    return res.status(500).json({ error: 'server error' });
  }
}


async function cancelReservation(req, res) {
  try {
    const id = req.params.reservation_id;
    const r = await logic.cancelReservation(id);
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function addToWaitlist(req, res) {
  try {
    const { user_id, station_id, connector_type } = req.body;
    if (!user_id || !station_id || !connector_type) return res.status(400).json({ error: 'missing fields' });
    const r = await logic.addToWaitlist({ user_id, station_id, connector_type });
    return res.json(r);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getUserReservations(req, res) {
  try {
    const user_id = req.params.user_id;
    const rows = await logic.getUserReservations(user_id);
    return res.json({ reservations: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = {
  checkAvailability,
  createReservation,
  getReservationById,
  updateReservation,
  cancelReservation,
  addToWaitlist,
  getUserReservations
};
