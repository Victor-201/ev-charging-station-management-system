const BookingService = require('../services/BookingService');

exports.createReservation = async (req, res) => {
  try {
     console.log('➡️ Received body:', req.body);
    const result = await BookingService.createReservation(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getReservationById = async (req, res) => {
  const data = await BookingService.getReservationById(req.params.reservation_id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
};

exports.getUserReservations = async (req, res) => {
  const list = await BookingService.getUserReservations(req.params.user_id);
  res.json(list);
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
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
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
    // Nếu bạn muốn dùng BookingService.generateQr thì gọi như bên dưới (giữ tương thích).
    const result = await BookingService.createQr(req.body);
    // trả về dạng ngắn gọn
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

/**
 * Validate QR
 * GET /api/qr/:qr_id/validate
 * Trả về { valid: boolean, reservation_id?: string }
 *
 * Bạn đã có hàm tương tự `validateQr` phía dưới; mình giữ nguyên (no-op if duplicate).
 */
exports.validateQr = async (req, res) => {
  try {
    const qr = await BookingService.validateQr(req.params.qr_id);
    res.json(qr);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * Mark QR as used
 * POST /api/qr/:qr_id/mark-used
 * body: {}
 *
 * Khi trạm xác nhận đã bắt đầu sạc, gọi endpoint này để đánh dấu mã QR đã dùng.
 */
exports.markUsed = async (req, res) => {
  try {
    const qr_id = req.params.qr_id;
    if (!qr_id) return res.status(400).json({ error: 'Missing qr_id' });

    // Nếu BookingService có method markUsed -> gọi đó, ngược lại implement trong BookingService.
    if (typeof BookingService.markUsed === 'function') {
      await BookingService.markUsed(qr_id);
    } else {
      // nếu chưa có, trả lỗi rõ ràng để dev biết cần implement
      throw new Error('BookingService.markUsed not implemented');
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[BookingController.markUsed]', err && err.stack ? err.stack : err);
    return res.status(400).json({ error: err.message });
  }
};

exports.runAutoCancelJob = async (req, res) => {
  res.json({ message: 'Auto cancel job triggered (implement cron later)' });
};

exports.checkAvailability = async (req, res) => {
  res.json({ available: true });
};
