import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
const router = express.Router();

router.post('/transaction', PaymentController.createTransaction);
router.post('/transaction/:id/confirm', PaymentController.confirmCashPayment);
router.post('/webhook', PaymentController.processBankWebhook);
router.post('/transaction/:id/refund', PaymentController.refundPayment);
router.get('/wallet/:user_id', PaymentController.getWallet);
router.post('/wallet/topup', PaymentController.topupWallet);
router.get('/user/:user_id/payments', PaymentController.listUserPayments);
router.get('/transaction/:id', PaymentController.getPaymentById);

export default router;
