import PaymentService from '../services/PaymentService.js';

const service = new PaymentService();

export class PaymentController {

  // =============================== TRANSACTION ===============================

  static async createTransaction(req, res, next) {
    try {
      const tx = await service.createTransaction(req.body);
      res.status(201).json({ success: true, data: tx.toJSON?.() || tx });
    } catch (err) {
      next(err);
    }
  }

  static async confirmCashPayment(req, res, next) {
    try {
      const tx = await service.confirmCashPayment(req.params.id);
      res.json({ success: true, data: tx.toJSON?.() || tx });
    } catch (err) {
      next(err);
    }
  }

  static async processBankWebhook(req, res, next) {
    console.log('Incoming body:', req.body);
    try {
      const result = await service.processBankWebhook(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async refundPayment(req, res, next) {
    try {
      const tx = await service.refundPayment(req.params.id, req.body);
      res.json({ success: true, data: tx.toJSON?.() || tx });
    } catch (err) {
      next(err);
    }
  }

  // =============================== WALLET ===============================

  static async getWallet(req, res, next) {
    try {
      const wallet = await service.getWalletInfo(req.params.user_id);
      res.json({ success: true, data: wallet.toJSON?.() || wallet });
    } catch (err) {
      next(err);
    }
  }

  static async initiateTopup(req, res, next) {
    try {
      const user_id = req.user?.user_id || req.user?.id || req.body.user_id;

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id is required' });
      }

      const transaction = await service.initiateTopup({ ...req.body, user_id });
      res.json({ success: true, data: transaction.toJSON?.() || transaction });
    } catch (err) {
      next(err);
    }
  }

  // =============================== LIST & DETAIL ===============================

  static async listUserPayments(req, res, next) {
    try {
      const list = await service.listUserPayments(req.params.user_id);
      res.json({ success: true, data: list.map(tx => tx.toJSON?.() || tx) });
    } catch (err) {
      next(err);
    }
  }

  static async getPaymentById(req, res, next) {
    try {
      const tx = await service.getPaymentById(req.params.id);
      res.json({ success: true, data: tx.toJSON?.() || tx });
    } catch (err) {
      next(err);
    }
  }

  // =============================== REVENUE / ANALYTICS ===============================
static async summary(req, res, next) {
    try {
      const total_revenue = await service.txRepo.getRevenueSummary();
      const total_transactions = await service.txRepo.getTotalTransactions?.() ?? 0;

      res.json({ total_revenue, total_transactions });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu hôm nay === */
  static async today(req, res, next) {
    try {
      const today_revenue = await service.txRepo.getTodayRevenue();
      res.json({ today_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo ngày (30 ngày gần nhất) === */
  static async daily(req, res, next) {
    try {
      const days = Number(req.query.days) || 30; // có thể truyền query ?days=10
      const daily_revenue = await service.txRepo.getDailyRevenue(days);
      res.json({ daily_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo tháng (12 tháng gần nhất) === */
  static async monthly(req, res, next) {
    try {
      const months = Number(req.query.months) || 12; // có thể truyền query ?months=6
      const monthly_revenue = await service.txRepo.getMonthlyRevenue(months);
      res.json({ monthly_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo type/related_type === */
  static async byType(req, res, next) {
    try {
      const revenue_by_type = await service.txRepo.getRevenueByType();
      res.json({ revenue_by_type });
    } catch (err) {
      next(err);
    }
  }
}