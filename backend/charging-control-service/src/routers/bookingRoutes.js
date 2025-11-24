const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/BookingController');
const { authenticate, authorize } = require('../middlewares/auth');

// ====================
// 🚗 RESERVATION APIs
// ====================

// Auto-cancel job (internal cron)
router.get('/auto-cancel', authorize('internal'), bookingCtrl.runAutoCancelJob);

// Check availability (public)
router.get('/check', bookingCtrl.checkAvailability);

// Create new reservation (user)
router.post('/', authenticate, bookingCtrl.createReservation);

// Get reservations by user
router.get('/user/:user_id', authenticate, bookingCtrl.getUserReservations);

// Get reservation detail
router.get('/:reservation_id', authenticate, bookingCtrl.getReservationById);

// Update reservation
router.put('/:reservation_id', authenticate, bookingCtrl.updateReservation);

// Cancel reservation
router.delete('/:reservation_id', authenticate, bookingCtrl.cancelReservation);

router.get('/pricing', authenticate, bookingCtrl.calculatePricing);
// ====================
// 🕓 WAITLIST APIs
// ====================

router.post('/waitlist', authenticate, bookingCtrl.addToWaitlist);
router.get('/waitlist/:station_id', authenticate, bookingCtrl.getByStation);
router.patch('/waitlist/:waitlist_id/status', authenticate, bookingCtrl.updateStatus);
router.delete('/waitlist/:waitlist_id', authenticate, bookingCtrl.removeFromWaitlist);

// ====================
// 📱 QR APIs
// ====================

// Generate QR
router.post('/qr/generate', authenticate, bookingCtrl.createQr);

// Validate QR (public)
router.get('/qr/:qr_id/validate', bookingCtrl.validateQr);

// Mark QR used
router.post('/qr/:qr_id/mark-used', authenticate, bookingCtrl.markUsed);

module.exports = router;
