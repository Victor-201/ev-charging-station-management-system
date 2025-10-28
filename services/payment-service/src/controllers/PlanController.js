import PlanService from '../services/PlanService.js';
const service = new PlanService();

export const listAll = async (req, res, next) => {
  try {
    const plans = await service.listAll();
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const plan = await service.getById(req.params.id);
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const plan = await service.create(req.body);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
};
