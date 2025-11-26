import PaymentService from '../services/PaymentService.js';
import InvoiceService from '../services/InvoiceService.js'

const service = new PaymentService();
const invoiceService = new InvoiceService();

export class PaymentController {

  // =============================== TRANSACTION ===============================
static async createTransaction(req, res, next) {
  try {
    const transaction = await service.createTransaction(req.body);
    const invoice = await invoiceService.generateFromTransaction(transaction.id);
    res.status(201).json({ transaction: transaction.toJSON?.() || transaction, invoice: invoice.toJSON?.() || invoice});
  } catch (err) {
    next(err);
  }
}

  static async confirmCashPayment(req, res, next) {
    try {
      const transaction = await service.confirmCashPayment(req.params.id);
      res.json({ success: true, data: transaction.toJSON?.() || transaction });
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
      res.json({ success: true, data: list.map(transaction => transaction.toJSON?.() || transaction) });
    } catch (err) {
      next(err);
    }
  }

  static async getPaymentById(req, res, next) {
    try {
      const transaction = await service.getPaymentById(req.params.id);
      res.json({ success: true, data: transaction.toJSON?.() || transaction });
    } catch (err) {
      next(err);
    }
  }

  // =============================== REVENUE / ANALYTICS ===============================
static async summary(req, res, next) {
    try {
      const total_revenue = await service.transactionRepo.getRevenueSummary();
      const total_transactions = await service.transactionRepo.getTotalTransactions?.() ?? 0;

      res.json({ total_revenue, total_transactions });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu hôm nay === */
  static async summaryToday(req, res, next) {
    try {
      const today_revenue = await service.transactionRepo.getTodayRevenue();
      res.json({ today_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo ngày (30 ngày gần nhất) === */
  static async summaryDaily(req, res, next) {
    try {
      const days = Number(req.query.days) || 30; // có thể truyền query ?days=10
      const daily_revenue = await service.transactionRepo.getDailyRevenue(days);
      res.json({ daily_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo tháng (12 tháng gần nhất) === */
  static async summaryMonthly(req, res, next) {
    try {
      const months = Number(req.query.months) || 12; // có thể truyền query ?months=6
      const monthly_revenue = await service.transactionRepo.getMonthlyRevenue(months);
      res.json({ monthly_revenue });
    } catch (err) {
      next(err);
    }
  }

  /** === Doanh thu theo type/related_type === */
  static async summaryByType(req, res, next) {
    try {
      const revenue_by_type = await service.transactionRepo.getRevenueByType();
      res.json({ revenue_by_type });
    } catch (err) {
      next(err);
    }
  }

  /** === API: Chi phí sạc hàng tháng === */
  static async getUserMonthlyChargingCost(req, res) {
    try {
      // allow both /revenue/charging/monthly (current user) and /revenue/:user_id/charging/monthly (admin or self)
      let user_id = req.params.user_id || req.user?.user_id || req.user?.id;
      const monthsRaw = req.query.months;
      const months = monthsRaw ? Number(monthsRaw) : 12;

      if (!user_id) {
        return res.status(400).json({ success: false, message: 'user_id is required' });
      }

      // permission check: only admin can fetch other users' data
      const requesterRole = req.user?.role;
      const requesterId = req.user?.user_id || req.user?.id;
      if (requesterRole !== 'admin' && requesterId !== user_id) {
        return res.status(403).json({ success: false, message: 'Forbidden: cannot access other user data' });
      }

      if (!Number.isFinite(months) || months <= 0 || months > 36) {
        return res.status(400).json({ success: false, message: 'months must be an integer between 1 and 36' });
      }

      const data = await service.getUserMonthlyChargingCost(user_id, months);

      return res.json({
        success: true,
        user_id,
        months,
        data,
      });
    } catch (err) {
      console.error("getUserMonthlyChargingCost error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** === API: Tổng chi phí sạc === */
  static async getUserChargingTotal(req, res) {
    try {
      // support both /revenue/charging/total (current user) and /revenue/:user_id/charging/total
      const user_id = req.params.user_id || req.user?.user_id || req.user?.id;

      if (!user_id) {
        return res.status(400).json({ success: false, message: 'user_id is required' });
      }

      const requesterRole = req.user?.role;
      const requesterId = req.user?.user_id || req.user?.id;
      if (requesterRole !== 'admin' && requesterId !== user_id) {
        return res.status(403).json({ success: false, message: 'Forbidden: cannot access other user data' });
      }

      const total = await service.getUserChargingTotal(user_id);

      return res.json({
        success: true,
        user_id,
        total,
      });
    } catch (err) {
      console.error("getUserChargingTotal error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

/** Doanh thu theo từng trạm */
  static async getRevenueByStation(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || null;
      const data = await service.revenueByStation(token);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  /** Doanh thu theo khu vực */
  static async getRevenueByRegion(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || null;
      const data = await service.revenueByRegion(token);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
}