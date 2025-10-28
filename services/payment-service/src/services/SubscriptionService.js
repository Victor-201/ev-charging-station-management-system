import db from '../config/db.js';
import PlanRepository from '../repositories/PlanRepository.js';
import SubscriptionRepository from '../repositories/SubscriptionRepository.js';
import PaymentService from './PaymentService.js';
import eventBus from '../core/EventBus.js';

/**
 * SubscriptionService
 * ------------------------------
 * Quản lý vòng đời Subscription:
 *  - Tạo yêu cầu đăng ký (tạo giao dịch bank)
 *  - Tạo subscription sau khi thanh toán thành công
 *  - Hủy subscription
 *  - Lấy danh sách / trạng thái active
 */
export default class SubscriptionService {
  constructor() {
    this.planRepo = new PlanRepository();
    this.subRepo = new SubscriptionRepository();
    this.paymentService = new PaymentService();

    // Đăng ký listener cho sự kiện thanh toán thành công
    eventBus.on('payment.succeeded', async (payload) => {
      try {
        if (payload.type === 'SUBSCRIPTION') {
          await this.handlePaymentSuccess(payload);
        }
      } catch (err) {
        console.error('[SubscriptionService] handlePaymentSuccess error:', err);
      }
    });
  }

  /**
   * Khởi tạo đăng ký gói mới:
   *  - Tạo giao dịch thanh toán qua ngân hàng
   *  - Trả về reference_code để user chuyển khoản
   * ------------------------------
   * @param {Object} params
   * @param {string} params.user_id
   * @param {string} params.plan_id
   * @returns {Promise<Object>}
   */
  async create({ user_id, plan_id }) {
    const plan = await this.planRepo.findById(plan_id);
    if (!plan) {
      throw Object.assign(new Error('Plan not found'), { status: 404 });
    }
    console.log(plan);
    // Tạo giao dịch thanh toán
    const transaction = await this.paymentService.createTransaction({
      user_id,
      type: 'SUBSCRIPTION',
      amount: plan.price,
      currency: 'VND',
      method: 'bank',
      related_id: plan_id,
      description: `Đăng ký gói ${plan.name}`,
    });

    return {
      message: 'Transaction created. Please complete bank transfer to activate your plan.',
      transaction: transaction.toJSON(),
    };
  }

  /**
   * Khi thanh toán thành công (eventBus)
   * ------------------------------
   * @param {Object} payload
   * @param {string} payload.user_id
   * @param {string} payload.related_id (plan_id)
   */
  async handlePaymentSuccess({ user_id, related_id }) {
    const plan = await this.planRepo.findById(related_id);
    if (!plan) {
      console.warn(`[SubscriptionService] Plan not found for ID ${related_id}`);
      return;
    }

    const start_date = new Date();
    let end_date = null;

    if (plan.duration) {
      const { rows } = await db.query(
        'SELECT NOW() + $1::interval AS end_date',
        [plan.duration]
      );
      end_date = rows[0].end_date;
    } else if (plan.duration_days) {
      end_date = new Date();
      end_date.setDate(end_date.getDate() + plan.duration_days);
    }

    const sub = await this.subRepo.create({
      user_id,
      plan_id: related_id,
      start_date,
      end_date,
      status: 'active',
    });

    console.log(`[SubscriptionService] Subscription created for user ${user_id}:`, sub.id);
  }

  /**
   * Hủy subscription đang hoạt động
   * ------------------------------
   * @param {string} id
   * @returns {Promise<Subscription>}
   */
  async cancel(id) {
    const sub = await this.subRepo.findById(id);
    if (!sub) throw Object.assign(new Error('Subscription not found'), { status: 404 });
    if (sub.status === 'cancelled')
      throw Object.assign(new Error('Subscription already cancelled'), { status: 400 });

    return this.subRepo.cancel(id);
  }

  /** Lấy subscription đang hoạt động của user */
  async getActiveByUser(user_id) {
    return this.subRepo.findActiveByUser(user_id);
  }

  /** Liệt kê tất cả subscription của user */
  async listByUser(user_id) {
    return this.subRepo.findAllByUser(user_id);
  }
}
