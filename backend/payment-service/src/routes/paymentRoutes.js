import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

// Transaction routes
router.post('/transaction', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.createTransaction);
router.post('/transaction/:id/confirm', authorize(UserRole.ADMIN), PaymentController.confirmCashPayment);
router.get('/transaction/:id', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getPaymentById);
router.post('/transaction/:id/refund', authorize(UserRole.ADMIN), PaymentController.refundPayment);

// Webhook (no auth required)
router.post('/webhook', PaymentController.processBankWebhook);

// Wallet routes
router.get('/wallet/:user_id', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.getWallet);
router.post('/wallet/topup', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.topupWallet);

// User payment history
router.get('/user/:user_id/payments', authorize(UserRole.ADMIN, UserRole.USER), PaymentController.listUserPayments);

export default router;
