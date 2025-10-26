import SubscriptionService from '../services/SubscriptionService.js';
const service = new SubscriptionService();

/**
 * Controller cho Subscription
 * ------------------------------
 * Gọi sang service tương ứng, xử lý API response
 */
export const create = async (req, res, next) => {
  try {
    const result = await service.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const sub = await service.cancel(req.params.id);
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

export const getActiveByUser = async (req, res, next) => {
  try {
    const subs = await service.getActiveByUser(req.params.user_id);
    res.json(subs);
  } catch (err) {
    next(err);
  }
};

export const listByUser = async (req, res, next) => {
  try {
    const subs = await service.listByUser(req.params.user_id);
    res.json(subs);
  } catch (err) {
    next(err);
  }
};
