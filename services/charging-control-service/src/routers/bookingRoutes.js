const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/BookingController'); 

// --- Reservation APIs ---
router.get('/auto-cancel', bookingCtrl.runAutoCancelJob);
router.get('/check', bookingCtrl.checkAvailability);
router.post('/', bookingCtrl.createReservation);
router.post('/waitlist', bookingCtrl.addToWaitlist);
router.get('/user/:user_id', bookingCtrl.getUserReservations);
router.get('/:reservation_id', bookingCtrl.getReservationById);
router.put('/:reservation_id', bookingCtrl.updateReservation);
router.delete('/:reservation_id', bookingCtrl.cancelReservation);

// --- QR Code APIs ---
router.post('/qr/generate', bookingCtrl.generateQr);
router.get('/qr/:qr_id/validate', bookingCtrl.validateQr);

module.exports = router;
