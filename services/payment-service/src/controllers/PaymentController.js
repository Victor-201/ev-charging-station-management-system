import PaymentService from '../services/PaymentService.js';

export const createIntent = async (req, res, next) => {
  try {
    const result = await PaymentService.createTransaction(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { transaction_id } = req.body;
    const result = await PaymentService.confirmCashPayment(transaction_id);
    res.json(result);
  } catch (err) { next(err); }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await PaymentService.getPaymentById(req.params.payment_id);
    res.json(payment);
  } catch (err) { next(err); }
};

export const webhook = async (req, res, next) => {
  try {
    const result = await PaymentService.processBankWebhook({ provider: req.headers['x-provider'] || 'unknown', payload: req.body });
    res.json(result);
  } catch (err) { next(err); }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const result = await PaymentService.refundPayment(req.params.payment_id, { amount, reason });
    res.json(result);
  } catch (err) { next(err); }
};
