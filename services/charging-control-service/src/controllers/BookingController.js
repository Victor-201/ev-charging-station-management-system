const BookingService = require('../services/BookingService');

exports.createReservation = async (req, res) => {
  try {
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
    const updated = await BookingService.updateReservation(req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
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
  const wait = await BookingService.addToWaitlist(req.body);
  res.json(wait);
};

exports.generateQr = async (req, res) => {
  const qr = await BookingService.generateQr(req.body);
  res.json(qr);
};

exports.validateQr = async (req, res) => {
  try {
    const qr = await BookingService.validateQr(req.params.qr_id);
    res.json(qr);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.runAutoCancelJob = async (req, res) => {
  res.json({ message: 'Auto cancel job triggered (implement cron later)' });
};

exports.checkAvailability = async (req, res) => {
  res.json({ available: true });
};
