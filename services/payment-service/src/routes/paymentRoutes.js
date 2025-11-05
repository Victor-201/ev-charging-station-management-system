import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';

const router = express.Router();

// === TRANSACTION ===
router.post('/transaction', PaymentController.createTransaction);
router.post('/transaction/:id/confirm', PaymentController.confirmCashPayment);
router.get('/transaction/:id', PaymentController.getPaymentById);
router.post('/transaction/:id/refund', PaymentController.refundPayment);

// === BANK WEBHOOK ===
router.post('/webhook', PaymentController.processBankWebhook);

// === WALLET ===
router.get('/wallet/:user_id', PaymentController.getWallet);
router.post('/wallet/topup', PaymentController.topupWallet);

// === USER PAYMENTS ===
router.get('/user/:user_id/payments', PaymentController.listUserPayments);

export default router;
