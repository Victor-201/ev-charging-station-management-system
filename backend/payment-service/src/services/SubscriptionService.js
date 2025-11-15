import SubscriptionRepository from '../repositories/SubscriptionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import localBus from '../core/LocalEventBus.js';

export default class SubscriptionService {
  constructor() {
    this.subRepo = new SubscriptionRepository();
    this.planRepo = new PlanRepository();
    this.walletRepo = new WalletRepository();

    this.setupEventListeners();
  }

  setupEventListeners() {
    // SUCCESS
    localBus.subscribe('payment.subscription.succeeded', async (payload) => {
      console.log('[SubscriptionService] Received payment.subscription.succeeded:', payload);
      try {
        await this.activateOrExtendSubscription(payload);
      } catch (err) {
        console.error('[SubscriptionService] Error handling subscription:', err);
      }
    });

    // FAILED
    localBus.subscribe('payment.subscription.failed', async (payload) => {
      console.log('[SubscriptionService] Received payment.subscription.failed:', payload);
      try {
        await this.handleFailedPayment(payload);
      } catch (err) {
        console.error('[SubscriptionService] Error handling failed subscription:', err);
      }
    });

    // UNDERPAID
    localBus.subscribe('payment.subscription.underpaid', async (payload) => {
      console.log('[SubscriptionService] Received payment.subscription.underpaid:', payload);
      try {
        await this.handleUnderpaidPayment(payload);
      } catch (err) {
        console.error('[SubscriptionService] Error handling underpaid subscription:', err);
      }
    });

    // CANCELLED
    localBus.subscribe('payment.subscription.cancelled', async (payload) => {
      console.log('[SubscriptionService] Received payment.subscription.cancelled:', payload);
      try {
        await this.handleCancelledPayment(payload);
      } catch (err) {
        console.error('[SubscriptionService] Error handling cancelled subscription:', err);
      }
    });
  }

  async handleFailedPayment({ related_id }) {
    const sub = await this.subRepo.findById(related_id);
    if (sub && sub.status === 'pending') {
      await this.subRepo.cancel(sub.id);
      console.log(`[SubscriptionService] Subscription ${sub.id} cancelled due to failed payment`);
    }
  }

  async handleUnderpaidPayment({ related_id }) {
    const sub = await this.subRepo.findById(related_id);
    if (sub && sub.status === 'pending') {
      await this.subRepo.cancel(sub.id);
      console.log(`[SubscriptionService] Subscription ${sub.id} cancelled due to underpaid`);
    }
  }

  async handleCancelledPayment({ related_id }) {
    const sub = await this.subRepo.findById(related_id);
    if (sub && sub.status === 'pending') {
      await this.subRepo.cancel(sub.id);
      console.log(`[SubscriptionService] Subscription ${sub.id} cancelled by user`);
    }
  }

  async createSubscription({ user_id, plan_id, duration_days }) {
    const newSub = await this.subRepo.create({
      user_id,
      plan_id,
      start_date: new Date(),
      end_date: this.calculateEndDate(new Date(), duration_days),
      status: 'pending'
    });

    console.log(`[SubscriptionService] Created pending subscription for user ${user_id}`);
    return newSub;
  }

  async activateOrExtendSubscription({ related_id }) {
    const subscription = await this.subRepo.findById(related_id);
    if (!subscription) return null;

    const plan = await this.planRepo.findById(subscription.plan_id);
    if (!plan) return null;

    if (subscription.status === 'active') {
      const newEnd = this.calculateEndDateFrom(subscription.end_date, plan.duration_days);
      const updatedSub = await this.subRepo.updateById(subscription.id, { end_date: newEnd });
      console.log(`[SubscriptionService] Subscription ${subscription.id} renewed successfully until ${newEnd.toISOString()}`);
      return updatedSub;
    } else {
      const activatedSub = await this.subRepo.updateById(subscription.id, { status: 'active' });
      if (!activatedSub) return null;

      const endDate = this.calculateEndDate(new Date(), plan.duration_days);
      const updatedSub = await this.subRepo.updateById(activatedSub.id, { end_date: endDate });
      console.log(`[SubscriptionService] Subscription ${subscription.id} activated successfully until ${endDate.toISOString()}`);
      return updatedSub;
    }
  }

  calculateEndDate(startDate, durationDays) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays);
    return end;
  }

  calculateEndDateFrom(currentEndDate, durationDays) {
    const end = new Date(currentEndDate);
    end.setDate(end.getDate() + durationDays);
    return end;
  }

  async cancelSubscription(id) {
    const sub = await this.subRepo.findById(id);
    if (!sub) throw Object.assign(new Error('Subscription not found'), { status: 404 });

    return await this.subRepo.cancel(id);
  }

  async getUserSubscription(user_id) {
    return this.subRepo.findActiveByUser(user_id);
  }

  async listUserSubscriptions(user_id) {
    return this.subRepo.findAllByUser(user_id);
  }
}
