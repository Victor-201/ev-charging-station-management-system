const express = require('express');
const router = express.Router();
const sessionCtrl = require('../controllers/ChargingController');
const { authenticate, authorize } = require('../middlewares/auth');
const { UserRole } = require('../constants/roles');



router.post('/initiate', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.initiateSession);
router.post('/start', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.startSession);
router.post('/:session_id/meter', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.pushMeterReading);
router.get('/:session_id/telemetry', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.getTelemetry);
router.put('/sessions/:session_id/telemetry', sessionCtrl.updateTelemetry);
router.delete('/sessions/:session_id/telemetry', sessionCtrl.deleteTelemetry);

router.post('/:session_id/pause', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.pauseSession);
router.post('/:session_id/resume', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.resumeSession);
router.post('/:session_id/stop', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.stopSession);
router.post('/:session_id/reconcile', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.reconcileSession);
router.get('/:station_id/active-points', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), sessionCtrl.getActivePoints);

router.get('/:session_id', authenticate, sessionCtrl.getSession);
router.get('/:session_id/events', authenticate, sessionCtrl.getEvents);
router.get('/:session_id/invoice', authenticate, sessionCtrl.getInvoice);
router.get('/:user_id/sessions', authenticate, sessionCtrl.getUserSessions);


module.exports = router;
