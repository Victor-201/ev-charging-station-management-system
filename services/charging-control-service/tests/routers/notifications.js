const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

router.post('/send', ctrl.sendNotification);

module.exports = router;
