import { Request, Response } from 'express';
import subscriptionService from '../services/subscriptionService';
import logger from '../utils/logger';

export class SubscriptionController {
  // GET /api/v1/users/:user_id/subscriptions - Get user subscriptions
  async getUserSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;

      const subscriptions = await subscriptionService.getUserSubscriptions(user_id);

      res.json({ subscriptions });
    } catch (error) {
      logger.error('Error in getUserSubscriptions:', error);
      res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  }

  // POST /api/v1/users/:user_id/subscriptions - Subscribe to plan
  async subscribeToPlan(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { plan_id, auto_renew = true } = req.body;

      const subscriptionId = await subscriptionService.subscribeToPlan(user_id, plan_id, auto_renew);

      res.status(201).json({
        subscription_id: subscriptionId,
        status: 'active',
      });
    } catch (error: any) {
      logger.error('Error in subscribeToPlan:', error);
      if (error.message.includes('already has')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to subscribe to plan' });
      }
    }
  }

  // POST /api/v1/users/:user_id/subscriptions/:subscription_id/cancel - Cancel subscription
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, subscription_id } = req.params;

      await subscriptionService.cancelSubscription(subscription_id, user_id);

      res.json({ status: 'cancelled' });
    } catch (error: any) {
      logger.error('Error in cancelSubscription:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to cancel subscription' });
      }
    }
  }
}

export default new SubscriptionController();
