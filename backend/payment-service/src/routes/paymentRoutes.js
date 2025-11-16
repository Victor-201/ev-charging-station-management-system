import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { verifyWebhook } from '../middlewares/webhookAuth.js';
import { UserRole } from '../constants/roles.js';

const router = express.Router();

// Webhook (public)
router.post('/transaction/webhook', verifyWebhook, PaymentController.processBankWebhook);

// Auth required
router.use(authenticate);

// Transaction routes
router.post('/transaction', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.createTransaction);
router.post('/transaction/:id/confirm', authorize(UserRole.ADMIN), PaymentController.confirmCashPayment);
router.get('/transaction/:id', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getPaymentById);
router.post('/transaction/:id/refund', authorize(UserRole.ADMIN), PaymentController.refundPayment);

// Wallet routes
router.get('/wallet/:user_id', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getWallet);
router.post('/wallet/topup', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.initiateTopup);

// User payment history
router.get('/user/:user_id/payments', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.listUserPayments);


// revenue statistics
router.get('/revenue/summary', PaymentController.summary);
router.get('/revenue/today', PaymentController.today);
router.get('/revenue/daily', PaymentController.daily);
router.get('/revenue/monthly', PaymentController.monthly);
router.get('/revenue/by-type', PaymentController.byType);

export default router;
