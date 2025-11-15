import SubscriptionRepository from '../repositories/SubscriptionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import localBus from '../core/LocalEventBus.js';

/**
 * SubscriptionService
 * ------------------------------
 * Handles subscription logic (plans / subscriptions):
 *  - Activate new subscription after successful payment
 *  - Extend subscription when the user repurchases
 *  - Cancel or check subscription status
 */
export default class SubscriptionService {
  constructor() {
    this.subRepo = new SubscriptionRepository();
    this.planRepo = new PlanRepository();
    this.walletRepo = new WalletRepository();

    // Listen for internal events when payment succeeds
    this.setupEventListeners();
  }

  setupEventListeners() {
    localBus.subscribe('payment.subscription.succeeded', async (payload) => {
      console.log('[SubscriptionService] Received payment.subscription.succeeded event:', payload);
      try {
        await this.activateOrExtendSubscription(payload);
      } catch (err) {
        console.error('[SubscriptionService] Error handling subscription:', err);
      }
    });
  }

  // Create a new subscription in pending status
  async createSubscription({ user_id, plan_id, duration_days}) {
    const newSub = await this.subRepo.create({
      user_id,
      plan_id,
      start_date: new Date(),
      end_date: this.calculateEndDate(new Date(), duration_days),
      status: 'pending',
    });

    console.log(`[SubscriptionService] Created subscription in pending status for user ${user_id}`);
    return newSub;
  }

  // Activate a subscription (or extend if already active)
  async activateOrExtendSubscription({ user_id, related_id, amount, method }) {
    const plan = await this.planRepo.findById(related_id);
    if (!plan) throw new Error('Plan not found');

    // Check if the user has an active subscription for this plan
    let sub = await this.subRepo.findActiveByUserAndPlan(user_id, plan_id);
    if (sub) {
      // Extend existing subscription
      sub.end_date = this.calculateEndDateFrom(sub.end_date, plan.duration_days);
      await this.subRepo.update(sub.id, { end_date: sub.end_date, amount, method });
      console.log(`[SubscriptionService] Extended subscription for user ${user_id}`);
      return sub;
    }

    // Otherwise, activate pending subscription
    sub = await this.subRepo.findPendingByUserAndPlan(user_id, plan_id);
    if (!sub) {
      console.warn(`[SubscriptionService] Pending subscription not found for user ${user_id}, plan ${plan_id}`);
      return null;
    }

    sub.status = 'active';
    sub.end_date = this.calculateEndDate(new Date(), plan.duration_days);
    await this.subRepo.update(sub.id, { status: 'active', method, amount, end_date: sub.end_date });
    console.log(`[SubscriptionService] Activated subscription for user ${user_id}`);
    return sub;
  }

  // Calculate end date from a start date
  calculateEndDate(startDate, durationDays) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays);
    return end;
  }

  // Calculate end date from current end date (for extending)
  calculateEndDateFrom(currentEndDate, durationDays) {
    const end = new Date(currentEndDate);
    end.setDate(end.getDate() + durationDays);
    return end;
  }

  // Cancel subscription
  async cancelSubscription(id) {
    const sub = await this.subRepo.findById(id);
    if (!sub) throw Object.assign(new Error('Subscription not found'), { status: 404 });
    await this.subRepo.updateStatus(id, 'cancelled');
    console.log(`[SubscriptionService] Cancelled subscription ${id}`);
    return sub;
  }

  // Get active subscription for a user
  async getUserSubscription(user_id) {
    return await this.subRepo.findActiveByUser(user_id);
  }

  // List all subscriptions for a user
  async listUserSubscriptions(user_id) {
    return await this.subRepo.findByUser(user_id);
  }
}
