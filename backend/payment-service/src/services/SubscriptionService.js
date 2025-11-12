import SubscriptionRepository from '../repositories/SubscriptionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import localBus from '../core/LocalEventBus.js';

/**
 * SubscriptionService
 * ------------------------------
 * Quản lý logic gói dịch vụ (plan / subscription):
 *  - Kích hoạt gói mới khi thanh toán thành công
 *  - Gia hạn gói khi người dùng mua lại
 *  - Hủy / kiểm tra trạng thái gói
 */
export default class SubscriptionService {
  constructor() {
    this.subRepo = new SubscriptionRepository();
    this.planRepo = new PlanRepository();
    this.walletRepo = new WalletRepository();

    // Lắng nghe sự kiện nội bộ khi thanh toán thành công
    this.setupEventListeners();
  }

  setupEventListeners() {
    localBus.subscribe('payment.subscription.succeeded', async (payload) => {
      console.log('[SubscriptionService] Nhận sự kiện payment.subscription.succeeded:', payload);
      try {
        await this.activateSubscription(payload);
      } catch (err) {
        console.error('[SubscriptionService] Lỗi xử lý subscription:', err);
      }
    });
  }

  /**
   * Kích hoạt hoặc gia hạn gói sau khi thanh toán thành công
   */
  async activateSubscription({ user_id, related_id, amount, method, reference_code }) {
    const plan = await this.planRepo.findById(related_id);
    if (!plan) {
      console.warn(`[SubscriptionService] Plan không tồn tại: ${related_id}`);
      return;
    }

    const existing = await this.subRepo.findActiveByUserAndPlan(user_id, related_id);
    if (existing) {
      const extended = await this.subRepo.extendSubscription(existing.id, plan.duration_days);
      console.log(`[SubscriptionService] Gia hạn subscription cho user ${user_id} thêm ${plan.duration_days} ngày`);
      return extended;
    }

    const newSub = await this.subRepo.create({
      user_id,
      plan_id: related_id,
      start_date: new Date(),
      end_date: this.calculateEndDate(plan.duration_days),
      status: 'active',
      method,
      reference_code,
      amount,
    });

    console.log(`[SubscriptionService] Kích hoạt gói mới cho user ${user_id} (${plan.name})`);
    return newSub;
  }

  calculateEndDate(durationDays) {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + durationDays);
    return end;
  }

  async cancelSubscription(id) {
    const sub = await this.subRepo.findById(id);
    if (!sub) throw Object.assign(new Error('Subscription not found'), { status: 404 });
    return await this.subRepo.updateStatus(id, 'cancelled');
  }

  async getUserSubscription(user_id) {
    return await this.subRepo.findActiveByUser(user_id);
  }

  async listUserSubscriptions(user_id) {
    return await this.subRepo.findByUser(user_id);
  }
}
