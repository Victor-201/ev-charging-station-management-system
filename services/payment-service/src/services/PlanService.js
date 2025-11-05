// services/PlanService.js
import PlanRepository from '../repositories/PlanRepository.js';

/**
 * PlanService
 * Xử lý logic nghiệp vụ liên quan đến bảng "plans":
 *  - Lấy danh sách gói
 *  - Lấy chi tiết gói
 *  - Tạo mới, cập nhật, xóa
 */
export default class PlanService {
  constructor() {
    this.planRepo = new PlanRepository();
  }

  /** === Lấy tất cả plan === */
  async listAll() {
    return this.planRepo.findAll();
  }

  /**
   * === Lấy chi tiết plan theo ID ===
   * @param {string} id
   */
  async getById(id) {
    const plan = await this.planRepo.findById(id);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    return plan;
  }

  /**
   * === Tạo mới plan ===
   * @param {Object} params
   */
  async create({ name, description, type, price, duration, duration_days }) {
    if (!name || !type || price == null) {
      const err = new Error('Missing required fields: name, type, or price');
      err.status = 400;
      throw err;
    }

    // Validate enum: chỉ chấp nhận 'basic' | 'standard' | 'premium'
    const validTypes = ['basic', 'standard', 'premium'];
    if (!validTypes.includes(type)) {
      const err = new Error(`Invalid plan type: ${type}. Must be one of ${validTypes.join(', ')}`);
      err.status = 400;
      throw err;
    }

    return this.planRepo.create({
      name,
      description,
      type,
      price,
      duration,
      duration_days
    });
  }

  /**
   * === Cập nhật plan ===
   * @param {string} id
   * @param {Object} fields
   */
  async update(id, fields) {
    const plan = await this.planRepo.updateById(id, fields);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    return plan;
  }

  /**
   * === Xóa plan ===
   * @param {string} id
   */
  async delete(id) {
    const plan = await this.planRepo.deleteById(id);
    if (!plan) {
      const err = new Error('Plan not found');
      err.status = 404;
      throw err;
    }
    return plan;
  }
}
