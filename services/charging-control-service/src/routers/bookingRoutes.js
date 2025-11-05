const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/BookingController');

// ====================
// 🚗 RESERVATION APIs
// ====================

// ⚙️ Auto-cancel job
router.get('/auto-cancel', bookingCtrl.runAutoCancelJob);

// 🔍 Check availability
router.get('/check', bookingCtrl.checkAvailability);

// ➕ Create new reservation
router.post('/', bookingCtrl.createReservation);

// 🧾 Preview cost (chỉ xem, không lưu)
router.get('/:reservation_id/preview-cost', bookingCtrl.previewCost);

// 💰 Calculate & save cost
router.post('/:reservation_id/calculate-cost', bookingCtrl.calculateCost);

// ✅ Finalize reservation (complete + tính tiền)
router.post('/:reservation_id/finalize', bookingCtrl.finalizeReservation);

router.post('/:reservation_id/refun', bookingCtrl.refun);

// 👤 Get reservations by user
router.get('/user/:user_id', bookingCtrl.getUserReservations);

// 🔍 Get reservation detail
router.get('/:reservation_id', bookingCtrl.getReservationById);

// ✏️ Update reservation info
router.put('/:reservation_id', bookingCtrl.updateReservation);

// ❌ Cancel reservation
router.delete('/:reservation_id', bookingCtrl.cancelReservation);

// ====================
// 🕓 WAITLIST APIs
// ====================

router.post('/waitlist', bookingCtrl.addToWaitlist);
router.get('/waitlist/:station_id', bookingCtrl.getByStation);
router.patch('/waitlist/:waitlist_id/status', bookingCtrl.updateStatus);
router.delete('/waitlist/:waitlist_id', bookingCtrl.removeFromWaitlist);

// ====================
// 📱 QR Code APIs
// ====================

// Generate QR
router.post('/qr/generate', bookingCtrl.createQr);

// Validate QR
router.get('/qr/:qr_id/validate', bookingCtrl.validateQr);

// Mark QR as used
router.post('/qr/:qr_id/mark-used', bookingCtrl.markUsed);

module.exports = router;
