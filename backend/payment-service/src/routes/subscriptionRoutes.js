import express from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/activate', authorize('admin', 'user'), SubscriptionController.activate);
router.post('/:id/cancel', authorize('admin', 'user'), SubscriptionController.cancel);
router.get('/user/:user_id/active', authorize('admin', 'user'), SubscriptionController.getActiveByUser);
router.get('/user/:user_id', authorize('admin', 'user'), SubscriptionController.listByUser);

export default router;
