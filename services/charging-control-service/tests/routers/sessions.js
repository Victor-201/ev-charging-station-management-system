const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sessionController');

router.post('/initiate', ctrl.initiateSession);
router.post('/start', ctrl.startSession);
router.post('/:session_id/meter', ctrl.pushMeterReading);
router.get('/:session_id/telemetry', ctrl.getTelemetry);
router.post('/:session_id/pause', ctrl.pauseSession);
router.post('/:session_id/resume', ctrl.resumeSession);
router.post('/:session_id/stop', ctrl.stopSession);
router.get('/:session_id', ctrl.getSession);
router.get('/:session_id/events', ctrl.getEvents);

module.exports = router;
