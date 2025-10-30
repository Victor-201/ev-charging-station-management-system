const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/qrController');

router.post('/generate', ctrl.generateQr);
router.get('/:qr_id/validate', ctrl.validateQr);

module.exports = router;
