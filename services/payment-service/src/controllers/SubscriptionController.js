import SubscriptionService from '../services/SubscriptionService.js';
const service = new SubscriptionService();

/**
 * SubscriptionController
 * ------------------------------
 * Gọi sang SubscriptionService để xử lý các hành động liên quan đến gói dịch vụ
 */
export class SubscriptionController {
  static async activate(req, res, next) {
    try {
      const result = await service.activateSubscription(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const result = await service.cancelSubscription(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getActiveByUser(req, res, next) {
    try {
      const result = await service.getUserSubscription(req.params.user_id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listByUser(req, res, next) {
    try {
      const result = await service.listUserSubscriptions(req.params.user_id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
