import express from 'express';
import * as SubscriptionController from '../controllers/SubscriptionController.js';

const router = express.Router();

router.post('/', SubscriptionController.create);
router.post('/:id/cancel', SubscriptionController.cancel);
router.get('/user/:user_id/active', SubscriptionController.getActiveByUser);
router.get('/user/:user_id', SubscriptionController.listByUser);

export default router;
