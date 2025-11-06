// controllers/PlanController.js
import PlanService from '../services/PlanService.js';
const service = new PlanService();

/** === Lấy danh sách tất cả plan === */
export const listAll = async (req, res, next) => {
  try {
    const plans = await service.listAll();
    res.json(plans);
  } catch (err) {
    next(err);
  }
};

/** === Lấy chi tiết plan === */
export const getById = async (req, res, next) => {
  try {
    const plan = await service.getById(req.params.id);
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

/** === Tạo mới plan === */
export const create = async (req, res, next) => {
  try {
    const plan = await service.create(req.body);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
};

/** === Cập nhật plan === */
export const update = async (req, res, next) => {
  try {
    const plan = await service.update(req.params.id, req.body);
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

/** === Xóa plan === */
export const remove = async (req, res, next) => {
  try {
    const plan = await service.delete(req.params.id);
    res.json({
      message: 'Plan deleted successfully',
      deleted: plan
    });
  } catch (err) {
    next(err);
  }
};
