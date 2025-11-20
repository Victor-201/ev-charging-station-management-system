const express = require('express');
const router = express.Router();
const sessionCtrl = require('../controllers/ChargingController');
const { authenticate, authorize } = require('../middlewares/auth');
const { UserRole } = require('../constants/roles');

// ----- STAFF / ADMIN được quyền thao tác sạc -----
const staffOnly = authorize([UserRole.STAFF, UserRole.ADMIN]);

router.post('/initiate', authenticate, staffOnly, sessionCtrl.initiateSession);
router.post('/start', authenticate, staffOnly, sessionCtrl.startSession);
router.post('/:session_id/meter', authenticate, staffOnly, sessionCtrl.pushMeterReading);
router.get('/:session_id/telemetry', authenticate, staffOnly, sessionCtrl.getTelemetry);
router.post('/:session_id/pause', authenticate, staffOnly, sessionCtrl.pauseSession);
router.post('/:session_id/resume', authenticate, staffOnly, sessionCtrl.resumeSession);
router.post('/:session_id/stop', authenticate, staffOnly, sessionCtrl.stopSession);
router.post('/:session_id/reconcile', authenticate, staffOnly, sessionCtrl.reconcileSession);
router.get('/:station_id/active-points', authenticate, staffOnly, sessionCtrl.getActivePoints);

router.get('/:session_id', authenticate, sessionCtrl.getSession);
router.get('/:session_id/events', authenticate, sessionCtrl.getEvents);
router.get('/:session_id/invoice', authenticate, sessionCtrl.getInvoice);
router.get('/:user_id/sessions', authenticate, sessionCtrl.getUserSessions);

module.exports = router;
