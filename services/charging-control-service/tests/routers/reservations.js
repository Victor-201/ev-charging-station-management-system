const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservationController');

router.get('/auto-cancel', ctrl.runAutoCancelJob);
// Check availability (atomic check)
router.get('/check', ctrl.checkAvailability);

// Create reservation
router.post('/', ctrl.createReservation);

// Waitlist
router.post('/waitlist', ctrl.addToWaitlist);

// List user reservations
router.get('/user/:user_id', ctrl.getUserReservations);

// Get reservation detail
router.get('/:reservation_id', ctrl.getReservationById);

// Update reservation (extend/change time)
router.put('/:reservation_id', ctrl.updateReservation);

// Cancel reservation
router.delete('/:reservation_id', ctrl.cancelReservation);


module.exports = router;
