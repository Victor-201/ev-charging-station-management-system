import pool from '../config/database';
import { Subscription } from '../types';
import logger from '../utils/logger';

export class SubscriptionService {
  // Get user subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          user_id, 
          plan_id, 
          status, 
          start_date, 
          end_date, 
          auto_renew, 
          created_at,
          updated_at
         FROM subscriptions 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  // Subscribe to plan
  async subscribeToPlan(userId: string, planId: string, autoRenew: boolean = true): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already has active subscription for this plan
      const existingResult = await client.query(
        `SELECT id FROM subscriptions 
         WHERE user_id = $1 AND plan_id = $2 AND status = 'ACTIVE'`,
        [userId, planId]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('User already has an active subscription for this plan');
      }

      // Get plan details and duration (default to 30 days for now)
      // TODO: Integrate with plan-service to get actual plan details
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const result = await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
         VALUES ($1, $2, 'ACTIVE', $3, $4, $5)
         RETURNING id`,
        [userId, planId, startDate, endDate, autoRenew]
      );

      await client.query('COMMIT');
      
      logger.info(`User ${userId} subscribed to plan ${planId}`);
      
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error subscribing to plan:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
    try {
      const result = await pool.query(
        `UPDATE subscriptions 
         SET status = 'CANCELLED', auto_renew = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
         RETURNING id`,
        [subscriptionId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Subscription not found or already cancelled');
      }
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: string, planId?: string): Promise<boolean> {
    try {
      let query = `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'ACTIVE'`;
      const params: any[] = [userId];

      if (planId) {
        query += ` AND plan_id = $2`;
        params.push(planId);
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking active subscription:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();
