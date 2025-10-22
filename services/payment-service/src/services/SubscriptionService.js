import { SubscriptionModel } from '../models/SubscriptionModel.js';
import { PlanModel } from '../models/PlanModel.js';

export const SubscriptionService = {
  async create({ user_id, plan_id }){
    const plan = await PlanModel.findById(plan_id);
    if(!plan) throw Object.assign(new Error('Plan not found'), { status: 404 });

    // start today, calculate end_date with interval if provided
    const start_date = new Date();
    let end_date = null;
    if(plan.duration){
      // plan.duration expected to be interval string in DB; for demo: add 30 days if type prepaid
      end_date = new Date(start_date.getTime());
      end_date.setDate(end_date.getDate() + 30);
    }

    const sub = await SubscriptionModel.create({ user_id, plan_id, start_date, end_date });
    return sub;
  },
  async cancel(id){
    return await SubscriptionModel.cancel(id);
  }
};

export default SubscriptionService;
