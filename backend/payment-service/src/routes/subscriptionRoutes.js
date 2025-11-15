import express from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../constants/roles.js';

const router = express.Router();

// === Middleware xác thực ===
router.use(authenticate);

// === Subscription routes ===
router.post('/', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.create);
router.post('/:id/activate', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.activate);
router.post('/:id/cancel', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.cancel);

router.get('/user/:user_id/active', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.getActiveByUser);
router.get('/user/:user_id', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.listByUser);

router.get('/:id', authorize(UserRole.ADMIN, UserRole.USER), SubscriptionController.getById);
router.get('/', authorize(UserRole.ADMIN), SubscriptionController.listAll);

export default router;
