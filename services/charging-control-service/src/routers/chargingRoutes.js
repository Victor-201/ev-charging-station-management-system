const express = require('express');
const router = express.Router();
const sessionCtrl = require('../controllers/ChargingController');

// --- Charging Session APIs ---
router.post('/initiate', sessionCtrl.initiateSession);
router.post('/start', sessionCtrl.startSession);
router.post('/:session_id/meter', sessionCtrl.pushMeterReading);
router.get('/:session_id/telemetry', sessionCtrl.getTelemetry);
router.post('/:session_id/pause', sessionCtrl.pauseSession);
router.post('/:session_id/resume', sessionCtrl.resumeSession);
router.post('/:session_id/stop', sessionCtrl.stopSession);
router.get('/:session_id', sessionCtrl.getSession);
router.get('/:session_id/events', sessionCtrl.getEvents);

router.post('/:session_id/confirm-payment', sessionCtrl.confirmPayment);
router.get('/:session_id/invoice', sessionCtrl.getInvoice); 
// routes.js or sessions router
router.get('/:user_id/sessions', sessionCtrl.getUserSessions);
router.get('/:station_id/active-points', sessionCtrl.getActivePoints);

module.exports = router;
