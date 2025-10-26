import PlanRepository from '../repositories/PlanRepository.js';

/**
 * PlanService
 * Chịu trách nhiệm xử lý các thao tác liên quan đến Plan:
 * - Lấy danh sách plan
 * - Lấy chi tiết plan
 * - Tạo mới plan
 */
export default class PlanService {
  constructor() {
    this.planRepo = new PlanRepository();
  }

  /** Lấy tất cả plan */
  async listAll() {
    return this.planRepo.findAll();
  }

  /**
   * Lấy chi tiết plan theo ID
   * @param {string} id - ID plan
   * @returns {Promise<Plan>}
   */
  async getById(id) {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw Object.assign(new Error('Plan not found'), { status: 404 });
    return plan;
  }

  /**
   * Tạo mới plan
   * @param {Object} params
   * @param {string} params.name - Tên plan
   * @param {string} [params.description] - Mô tả
   * @param {string} params.type - Loại plan
   * @param {number} params.price - Giá plan
   * @param {string} [params.duration] - Thời gian dạng interval PostgreSQL
   * @param {number} [params.duration_days] - Thời gian theo ngày
   * @returns {Promise<Plan>}
   */
  async create({ name, description, type, price, duration, duration_days }) {
    if (!name || !type || !price)
      throw Object.assign(new Error('Missing required fields'), { status: 400 });

    return this.planRepo.create({
      name,
      description,
      type,
      price,
      duration,
      duration_days
    });
  }
}
