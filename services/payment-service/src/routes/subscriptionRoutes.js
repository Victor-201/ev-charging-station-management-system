import express from 'express';
import * as SubscriptionController from '../controllers/SubscriptionController.js';
const router = express.Router();

router.post('/', SubscriptionController.create);
router.post('/:id/cancel', SubscriptionController.cancel);

export default router;
