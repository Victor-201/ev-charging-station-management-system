const BookingService = require('../services/BookingService');

/**
 * Controller for reservation & waitlist endpoints
 */

exports.createReservation = async (req, res) => {
  try {
    console.log('➡️ Received body:', req.body);
    const result = await BookingService.createReservation(req.body);
    return res.status(201).json(result);
  } catch (e) {
    console.error('[createReservation] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const data = await BookingService.getReservationById(req.params.reservation_id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  } catch (e) {
    console.error('[getReservationById] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

exports.getUserReservations = async (req, res) => {
  try {
    const list = await BookingService.getUserReservations(req.params.user_id);
    return res.json(list);
  } catch (e) {
    console.error('[getUserReservations] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    // debug logs để bạn thấy dữ liệu vào server
    console.log('[updateReservation] method:', req.method);
    console.log('[updateReservation] params:', req.params);
    console.log('[updateReservation] query:', req.query);
    console.log('[updateReservation] body keys:', Object.keys(req.body || {}));
    console.log('[updateReservation] body:', req.body);

    // tìm id theo thứ tự ưu tiên: route params (nhiều tên), body, query
    const reservation_id =
      req.params?.id ||
      req.params?.reservationId ||
      req.params?.reservation_id ||
      req.body?.reservation_id ||
      req.body?.reservationId ||
      req.body?.id ||
      req.query?.reservation_id ||
      req.query?.id;

    if (!reservation_id) {
      // trả lỗi 400 nhưng kèm info để debug client
      return res.status(400).json({
        error: 'Missing reservation_id',
        hint: 'send id either as URL param /reservations/:id or in JSON body property "reservation_id" or "id"',
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

exports.cancelReservation = async (req, res) => {
  try {
    const result = await BookingService.cancelReservation(req.params.reservation_id);
    return res.json(result);
  } catch (e) {
    console.error('[cancelReservation] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

exports.addToWaitlist = async (req, res) => {
  try {
    const payload = req.body || {};
    const entry = await BookingService.addToWaitlist(payload);
    return res.status(201).json(entry);
  } catch (err) {
    console.error('[WaitlistController.addToWaitlist]', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

exports.getByStation = async (req, res) => {
  try {
    const station_id = req.params.station_id || req.query.station_id || req.body.station_id;
    if (!station_id) return res.status(400).json({ error: 'Missing station_id' });
    const list = await BookingService.getWaitlistByStation(station_id);
    return res.json(list);
  } catch (err) {
    console.error('[WaitlistController.getByStation]', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const waitlist_id = req.params.waitlist_id; // đúng tên param
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    const updated = await BookingService.updateStatus(waitlist_id, status);
    return res.json(updated);
  } catch (err) {
    console.error('[WaitlistController.updateStatus]', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.removeFromWaitlist = async (req, res) => {
  try {
    console.log('[removeFromWaitlist] params=', req.params);

    const waitlist_id = req.params.waitlist_id;
    if (!waitlist_id) return res.status(400).json({ error: 'Missing waitlist_id' });

    const result = await BookingService.removeFromWaitlist(waitlist_id);
    return res.json(result);
  } catch (err) {
    console.error('[WaitlistController.removeFromWaitlist]', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

exports.createQr = async (req, res) => {
  try {
    const result = await BookingService.createQr(req.body);
    return res.status(201).json({
      qr_code: result.qr_id || result.qr_code || result.qrId,
      url: result.url,
      expires_at: result.expires_at || null,
    });
  } catch (err) {
    console.error('[BookingController.createQr]', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

exports.validateQr = async (req, res) => {
  try {
    const qr = await BookingService.validateQr(req.params.qr_id);
    return res.json(qr);
  } catch (e) {
    console.error('[validateQr] error:', e && e.stack ? e.stack : e);
    return res.status(400).json({ error: e.message });
  }
};

exports.markUsed = async (req, res) => {
  try {
    const qr_id = req.params.qr_id;
    if (!qr_id) return res.status(400).json({ error: 'Missing qr_id' });

    if (typeof BookingService.markUsed === 'function') {
      await BookingService.markUsed(qr_id);
      return res.json({ ok: true });
    } else {
      throw new Error('BookingService.markUsed not implemented');
    }
  } catch (err) {
    console.error('[BookingController.markUsed]', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Run auto-cancel job (trigger cron manually)
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
 * Query params or body: station_id, point_id, start_time, end_time
 */
exports.checkAvailability = async (req, res) => {
  try {
    const station_id = req.query.station_id || req.body.station_id;
    const point_id = req.query.point_id || req.body.point_id;
    const start_time = req.query.start_time || req.body.start_time;
    const end_time = req.query.end_time || req.body.end_time;

    if (!station_id || !point_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing station_id, point_id, start_time or end_time' });
    }

    const available = await BookingService.checkAvailability(station_id, point_id, start_time, end_time);
    return res.json({ available });
  } catch (err) {
    console.error('[checkAvailability] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

//
// ----- Pricing / Cost endpoints -----
//

/**
 * Preview reservation cost (does not persist)
 * GET /reservations/:reservation_id/preview-cost
 */
exports.previewCost = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const result = await BookingService.previewReservationCost(reservation_id, { roundUp: true });
    return res.json(result);
  } catch (err) {
    console.error('[previewCost] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Calculate and persist reservation cost
 * POST /reservations/:reservation_id/calculate-cost
 * body: { roundUp?: boolean }
 */
exports.calculateCost = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id || req.body.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    const roundUp = req.body.roundUp !== undefined ? !!req.body.roundUp : true;
    const result = await BookingService.calculateReservationCost(reservation_id, { roundUp });
    return res.json(result);
  } catch (err) {
    console.error('[calculateCost] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Finalize reservation: set end_time (optional), complete, calculate cost
 * POST /reservations/:reservation_id/finalize
 * body: { end_time?: ISOString, roundUp?: boolean }
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
// --- thêm vào controllers/BookingController.js (bên cạnh các exports khác) ---
exports.refun = async (req, res) => {
  try {
    const reservation_id = req.params.reservation_id || req.body.reservation_id;
    if (!reservation_id) return res.status(400).json({ error: 'Missing reservation_id' });

    // optional body params
    const end_time = req.body.end_time || null;       // ISO string hoặc null -> now
    const roundUp = req.body.roundUp !== undefined ? !!req.body.roundUp : true;
    const autoExecutePayment = req.body.autoExecutePayment === true; // nếu true: publish event để billing auto xử lý

    // gọi service finalize (service sẽ cập nhật end_time, status và tính cost)
    const result = await BookingService.finalizeReservation(reservation_id, { end_time, roundUp });

    // result chứa: { reservation_id, minutes, previous_total, new_total, difference, action, message }
    // nếu cần publish event chi tiết cho billing, controller sẽ publish (non-blocking)
    // publish() trong BookingService cũng đã publish RESERVATION_PAYMENT_ADJUSTMENT, nhưng ta có thể phát thêm event tách riêng nếu autoExecutePayment = true
    if (autoExecutePayment && typeof BookingService.publishPaymentAction === 'function') {
      // nếu bạn muốn service tự thực hiện publish vào queue billing, bạn có thể implement hàm này.
      try {
        await BookingService.publishPaymentAction(result);
      } catch (e) {
        console.error('[refun] publishPaymentAction failed:', e && e.stack ? e.stack : e);
        // không fail request, chỉ log
      }
    } else if (autoExecutePayment && typeof require('../rabbit').publish === 'function') {
      // fallback: publish minimal event directly
      try {
        const { publish } = require('../rabbit');
        const evt = {
          reservation_id: result.reservation_id,
          action: result.action,
          amount: result.difference,
          previous_total: result.previous_total,
          new_total: result.new_total,
          minutes: result.minutes,
          message: result.message,
        };
        // non-blocking with small timeout
        const p = publish('billing_events', { type: result.action === 'charge_extra' ? 'CHARGE_REQUIRED' : 'REFUND_REQUIRED', data: evt });
        // don't await long — but try to wait shortly
        await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('publish timeout')), 1500))]).catch(err => {
          console.warn('[refun] billing publish failed/timeout:', err.message);
        });
      } catch (err) {
        console.warn('[refun] cannot publish billing event, missing rabbit.publish', err.message || err);
      }
    }

    // trả response rõ ràng
    return res.json({
      ok: true,
      reservation_id: result.reservation_id,
      minutes: result.minutes,
      previous_total: result.previous_total,
      new_total: result.new_total,
      difference: result.difference,
      action: result.action,   // 'charge_extra' | 'refund' | 'none'
      message: result.message,
    });
  } catch (err) {
    console.error('[refun] error:', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};
