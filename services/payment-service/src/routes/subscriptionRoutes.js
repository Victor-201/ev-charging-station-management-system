import express from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController.js';

const router = express.Router();

// Kích hoạt (hoặc gia hạn) gói dịch vụ – dùng khi test thủ công
router.post('/activate', SubscriptionController.activate);

// Hủy gói hiện tại
router.post('/:id/cancel', SubscriptionController.cancel);

// Lấy gói đang hoạt động của user
router.get('/user/:user_id/active', SubscriptionController.getActiveByUser);

// Liệt kê tất cả gói của user
router.get('/user/:user_id', SubscriptionController.listByUser);

export default router;
