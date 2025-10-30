const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/NotificationController');

// --- Notification APIs ---
router.post('/send', notificationCtrl.sendNotification);

module.exports = router;
