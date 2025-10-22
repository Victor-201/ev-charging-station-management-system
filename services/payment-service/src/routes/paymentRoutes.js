import express from 'express';
import * as PaymentController from '../controllers/PaymentController.js';
const router = express.Router();

router.post('/create-intent', PaymentController.createIntent);
router.post('/confirm', PaymentController.confirmPayment);
router.get('/:payment_id', PaymentController.getPayment);
router.post('/webhook', PaymentController.webhook);
router.post('/:payment_id/refund', PaymentController.refundPayment);

export default router;
