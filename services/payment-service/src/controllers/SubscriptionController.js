import SubscriptionService from '../services/SubscriptionService.js';

export const create = async (req, res, next) => {
  try {
    const payload = req.body;
    const sub = await SubscriptionService.create(payload);
    res.status(201).json(sub);
  } catch (err) { next(err); }
};

export const cancel = async (req, res, next) => {
  try {
    const id = req.params.id;
    const sub = await SubscriptionService.cancel(id);
    res.json(sub);
  } catch (err) { next(err); }
};
