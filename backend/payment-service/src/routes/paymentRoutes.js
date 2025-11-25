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
router.post('/transaction', PaymentController.createTransaction);
router.post('/transaction/:id/confirm', authorize(UserRole.STAFF, UserRole.ADMIN), PaymentController.confirmCashPayment);
router.get('/transaction/:id', PaymentController.getPaymentById);

// Wallet routes
router.get('/wallet/:user_id', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getWallet);
router.post('/wallet/topup', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.initiateTopup);

// User payment history
router.get('/user/:user_id/payments', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.listUserPayments);


// revenue statistics
router.get('/revenue/summary', PaymentController.summary);
router.get('/revenue/today', PaymentController.summaryToday);
router.get('/revenue/daily', PaymentController.summaryDaily);
router.get('/revenue/monthly', PaymentController.summaryMonthly);
router.get('/revenue/by-type', PaymentController.summaryByType);

// allow current user endpoints (no user_id param)
router.get('/revenue/charging/monthly', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getUserMonthlyChargingCost);
router.get('/revenue/charging/total', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getUserChargingTotal);

// keep legacy/admin endpoints with explicit user id
router.get('/revenue/:user_id/charging/monthly', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getUserMonthlyChargingCost);
router.get('/revenue/:user_id/charging/total', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getUserChargingTotal);
export default router;
