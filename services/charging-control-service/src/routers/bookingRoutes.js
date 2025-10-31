const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/BookingController'); 

// --- Reservation APIs ---
router.get('/auto-cancel', bookingCtrl.runAutoCancelJob);
router.get('/check', bookingCtrl.checkAvailability);
router.post('/', bookingCtrl.createReservation);
router.post('/waitlist', bookingCtrl.addToWaitlist);
router.get('/waitlist/:station_id',bookingCtrl.getByStation );
router.patch('/waitlist/:waitlist_id/status',bookingCtrl.updateStatus);
router.delete('/waitlist/:waitlist_id', bookingCtrl.removeFromWaitlist);
router.get('/user/:user_id', bookingCtrl.getUserReservations);
router.get('/:reservation_id', bookingCtrl.getReservationById);
router.put('/:reservation_id', bookingCtrl.updateReservation);
router.delete('/:reservation_id', bookingCtrl.cancelReservation);

// --- QR Code APIs ---
router.post('/qr/generate', bookingCtrl.createQr);
router.get('/qr/:qr_id/validate', bookingCtrl.validateQr);

module.exports = router;
