const BookingService = require('../services/BookingService');
const debug = (...args) => console.log('[BookingController]', ...args);

/**
 * --- Reservation CRUD & Waitlist Controller ---
 */

/**
 * Create a new reservation
 * POST /reservations
 */
exports.createReservation = async (req, res) => {
  try {
    debug('➡️ Received body for createReservation:', req.body);

    // Service sẽ mặc định tạo pending, chỉ confirmed nếu caller gửi status: 'confirmed'
    const result = await BookingService.createReservation(req.body, req.user?.token);

    return res.status(201).json(result);
  } catch (e) {
    console.error('[createReservation] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};
exports.confirmReservation = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    const payment_info = req.body.payment_info || null;

    const result = await BookingService.confirmReservation(reservation_id, { payment_info });

    return res.json(result);
  } catch (e) {
    console.error('[confirmReservation] error:', e && e.stack ? e.stack : e);
    const status = e.status || 400;
    return res.status(status).json({ error: e.message });
  }
};

/**
 * Attach payment ID and confirm reservation
 * POST /reservations/:reservation_id/attach-payment
 */


/**
 * Mark payment failed
 * POST /reservations/:reservation_id/payment-failed
 */
exports.markPaymentFailed = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    const { cancel = true, reason = null } = req.body;

    const result = await BookingService.markPaymentFailed(reservation_id, { cancel, reason });

    return res.json(result);
  } catch (e) {
    console.error('[markPaymentFailed] error:', e && e.stack ? e.stack : e);
    const status = e.status || 400;
    return res.status(status).json({ error: e.message });
  }
};

/**
 * Get reservation by ID
 * GET /reservations/:reservation_id
 */
exports.getReservationById = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    const data = await BookingService.getReservationById(reservation_id);

    if (!data) return res.status(404).json({ error: 'Reservation not found' });

    return res.json(data);
  } catch (e) {
    console.error('[getReservationById] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

/**
 * Get all reservations of a user
 * GET /users/:user_id/reservations
 */
exports.getUserReservations = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    const list = await BookingService.getUserReservations(user_id);

    return res.json(list);
  } catch (e) {
    console.error('[getUserReservations] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

/**
 * Update reservation
 * PATCH /reservations/:reservation_id
 */
exports.updateReservation = async (req, res) => {
  try {
    debug('[updateReservation] params:', req.params);
    debug('[updateReservation] body:', req.body);

    // Lấy reservation_id ưu tiên từ route param, body, query
    const reservation_id =
      req.params?.reservation_id ||
      req.params?.id ||
      req.body?.reservation_id ||
      req.body?.id ||
      req.query?.reservation_id;

    if (!reservation_id) {
      return res.status(400).json({
        error: 'Missing reservation_id',
        hint: 'Send reservation_id in URL param or JSON body',
      });
    }

    const payload = { ...req.body, reservation_id };
    const updated = await BookingService.updateReservation(payload);

    return res.json(updated);
  } catch (e) {
    console.error('[updateReservation] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};


/**
 * Cancel reservation
 * POST /reservations/:reservation_id/cancel
 */
exports.cancelReservation = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const result = await BookingService.cancelReservation(reservation_id);
    return res.json(result);
  } catch (e) {
    console.error('[cancelReservation] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

/**
 * Add user to waitlist
 * POST /waitlist
 */
exports.addToWaitlist = async (req, res) => {
  try {
    const payload = req.body || {};
    const entry = await BookingService.addToWaitlist(payload);
    return res.status(201).json(entry);
  } catch (err) {
    console.error('[addToWaitlist] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Get waitlist for a station
 * GET /waitlist/:station_id
 */
exports.getByStation = async (req, res) => {
  try {
    const station_id = req.params.station_id || req.query.station_id || req.body.station_id;
    if (!station_id) return res.status(400).json({ error: 'Missing station_id' });

    const list = await BookingService.getWaitlistByStation(station_id);
    return res.json(list);
  } catch (err) {
    console.error('[getByStation] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Update waitlist status
 * PATCH /waitlist/:waitlist_id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const waitlist_id = req.params.waitlist_id;
    const status = req.body.status;

    if (!waitlist_id) return res.status(400).json({ error: 'Missing waitlist_id' });
    if (!status) return res.status(400).json({ error: 'Missing status' });

    const updated = await BookingService.updateWaitlistStatus(waitlist_id, status);
    return res.json(updated);
  } catch (err) {
    console.error('[updateStatus] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Remove from waitlist
 * DELETE /waitlist/:waitlist_id
 */
exports.removeFromWaitlist = async (req, res) => {
  try {
    const waitlist_id = req.params.waitlist_id;
    if (!waitlist_id) return res.status(400).json({ error: 'Missing waitlist_id' });

    const result = await BookingService.removeFromWaitlist(waitlist_id);
    return res.json(result);
  } catch (err) {
    console.error('[removeFromWaitlist] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Create QR code
 * POST /reservations/:reservation_id/qr
 */
exports.createQr = async (req, res) => {
  try {
    const body = { ...req.body };
    const result = await BookingService.createQr(body);
    return res.status(201).json({
      qr_code: result.qr_code || result.qr_id || result.qrId,
      url: result.url,
      expires_at: result.expires_at || null,
    });
  } catch (err) {
    console.error('[createQr] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Validate QR
 * GET /qr/:qr_id
 */
exports.validateQr = async (req, res) => {
  try {
    const qr_id = req.params.qr_id;
    if (!qr_id) return res.status(400).json({ error: 'Missing qr_id' });

    // gọi service
    const result = await BookingService.validateQr(qr_id);

    console.log('[Controller] validateQr result:', result); // debug test
    return res.json(result);
  } catch (e) {
    console.error('[Controller] validateQr error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};


/**
 * Mark QR as used
 * POST /qr/:qr_id/use
 */
exports.markUsed = async (req, res) => {
  try {
    const qr_id = req.params.qr_id;
    if (!qr_id) return res.status(400).json({ error: 'Missing qr_id' });

    await BookingService.markUsed(qr_id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[markUsed] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Run auto-cancel expired reservations (manual trigger)
 * POST /reservations/auto-cancel
 */
exports.runAutoCancelJob = async (req, res) => {
  try {
    const cancelled = await BookingService.autoCancelExpiredReservations();
    return res.json({ cancelled });
  } catch (err) {
    console.error('[runAutoCancelJob] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Check availability of a point
 * GET /reservations/check-availability
 */
exports.checkAvailability = async (req, res) => {
  try {
    const station_id = req.query.station_id || req.body.station_id;
    const point_id = req.query.point_id || req.body.point_id;
    const start_time = req.query.start_time || req.body.start_time;
    const end_time = req.query.end_time || req.body.end_time;

    if (!station_id || !point_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required params' });
    }

    const available = await BookingService.checkAvailability(station_id, point_id, start_time, end_time);
    return res.json({ available });
  } catch (err) {
    console.error('[checkAvailability] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Preview reservation cost (does not persist)
 * GET /reservations/:reservation_id/preview-cost
 */
exports.previewCost = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const result = await BookingService.previewReserrvationCost(reservation_id, { roundUp: true });
    return res.json(result);
  } catch (err) {
    console.error('[previewCost] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Calculate and persist reservation cost
 * POST /reservations/:reservation_id/calculate-cost
 */
exports.calculateCost = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id || req.body.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const roundUp = req.body.roundUp !== undefined ? !!req.body.roundUp : true;
    const payment_method = req.body.payment_method; // ✅ lấy từ body nếu có

    const result = await BookingService.calculateReservationCost(reservation_id, {
      roundUp,
      payment_method, // ✅ truyền xuống service
    });

    return res.json(result);
  } catch (err) {
    console.error('[calculateCost] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};


exports.calculatePricing = async (req, res) => {
  try {
    const { point_id, start_time, end_time } = req.query; // GET: lấy từ query
    const token = req.headers.authorization; // token từ header

    if (!point_id || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // gọi service để tính tiền
    const price = await chargingService.calculatePricing(point_id, start_time, end_time, token);

    res.json({ price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate pricing" });
  }
};

/**
 * Finalize reservation: complete, set end_time, calculate cost
 * POST /reservations/:reservation_id/finalize
 */
exports.finalizeReservation = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id || req.body.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const end_time = req.body.end_time || null;
    const roundUp = req.body.roundUp !== undefined ? !!req.body.roundUp : true;

    const result = await BookingService.finalizeReservation(reservation_id, { end_time, roundUp });

    return res.json(result);
  } catch (err) {
    console.error('[finalizeReservation] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};
exports.calculateReservation = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'reservation_id is required' });

    const roundUp = req.body.roundUp !== undefined ? Boolean(req.body.roundUp) : true;
    const payment_method = req.body.payment_method || null;

    const result = await BookingService.calculateReservationCost(reservation_id, { roundUp, payment_method });
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('[BookingController.calculateReservation] error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
/**
 * Refund / adjust payment (refun)
 * POST /reservations/:reservation_id/refun
 */
exports.refun = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id || req.body.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const end_time = req.body.end_time || null;
    const roundUp = req.body.roundUp !== undefined ? !!req.body.roundUp : true;
    const autoExecutePayment = req.body.autoExecutePayment === true;

    const result = await BookingService.finalizeReservation(reservation_id, { end_time, roundUp });

    // Optionally publish event to billing queue
    if (autoExecutePayment && typeof BookingService.publishPaymentAction === 'function') {
      try {
        await BookingService.publishPaymentAction(result);
      } catch (e) {
        console.warn('[refun] publishPaymentAction failed:', e.message || e);
      }
    }

    return res.json({
      ok: true,
      reservation_id: result.reservation_id,
      minutes: result.minutes,
      previous_total: result.previous_total,
      new_total: result.new_total,
      difference: result.difference,
      action: result.action,
      message: result.message,
    });
  } catch (err) {
    console.error('[refun] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};
