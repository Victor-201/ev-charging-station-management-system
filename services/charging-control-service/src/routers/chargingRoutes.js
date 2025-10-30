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

module.exports = router;
