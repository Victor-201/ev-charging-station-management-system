import SubscriptionService from '../services/SubscriptionService.js';
import PaymentService from '../services/PaymentService.js';
import PlanService from '../services/PlanService.js';

const paymentService = new PaymentService();
const planService = new PlanService();
const service = new SubscriptionService();

export class SubscriptionController {
  // === CREATE subscription (pending) ===
  static async create(req, res, next) {
    try {
      const { user_id, plan_id } = req.body;
      const plan = await planService.getById(plan_id);

      const subscription = await service.createSubscription({
        user_id,
        plan_id,
        duration_days: plan.getDurationDays()
      });

      const transaction = await paymentService.createTransaction({
        user_id,
        type: 'payment',
        method: 'bank_transfer',
        related_id: subscription.id,
        related_type: 'subscription',
        amount: plan.price,
        meta: { description: `Payment for subscription ${plan.name}` }
      });

      res.status(201).json({ success: true, data: { subscription, transaction } });
    } catch (err) {
      next(err);
    }
  }

  // === ACTIVATE / EXTEND subscription ===
  static async activate(req, res, next) {
    try {
      const payload = { ...req.body, related_id: req.params.id };
      const result = await service.activateOrExtendSubscription(payload);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // === CANCEL subscription ===
  static async cancel(req, res, next) {
    try {
      const result = await service.cancelSubscription(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // === GET active subscription của user ===
  static async getActiveByUser(req, res, next) {
    try {
      const result = await service.getUserSubscription(req.params.user_id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // === GET tất cả subscription của user ===
  static async listByUser(req, res, next) {
    try {
      const result = await service.listUserSubscriptions(req.params.user_id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // === GET subscription theo ID ===
  static async getById(req, res, next) {
    try {
      const result = await service.subRepo.findById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Subscription not found' });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // === GET tất cả subscription (admin only) ===
  static async listAll(req, res, next) {
    try {
      const result = await service.subRepo.findAll();
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
