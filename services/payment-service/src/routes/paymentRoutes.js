import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/transaction', authorize('admin', 'user'), PaymentController.createTransaction);
router.post('/transaction/:id/confirm', authorize('admin'), PaymentController.confirmCashPayment);
router.get('/transaction/:id', authorize('admin', 'user'), PaymentController.getPaymentById);
router.post('/transaction/:id/refund', authorize('admin'), PaymentController.refundPayment);

router.post('/webhook', PaymentController.processBankWebhook);

router.get('/wallet/:user_id', authorize('admin', 'user'), PaymentController.getWallet);
router.post('/wallet/topup', authorize('admin', 'user'), PaymentController.topupWallet);

router.get('/user/:user_id/payments', authorize('admin', 'user'), PaymentController.listUserPayments);

export default router;
