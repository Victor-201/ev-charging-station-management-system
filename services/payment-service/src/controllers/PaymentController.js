import PaymentService from '../services/PaymentService.js';
const service = new PaymentService();

export class PaymentController {
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

  static async getWallet(req, res, next) {
    try {
      const wallet = await service.getWalletInfo(req.params.user_id);
      res.json({ success: true, data: wallet.toJSON?.() || wallet });
    } catch (err) {
      next(err);
    }
  }

  static async topupWallet(req, res, next) {
    try {
      const result = await service.topupWallet(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

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
}
