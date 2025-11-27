import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const subscriptionService = {
  /**
   * Get all available subscription plans
   * @returns {Promise<Array>} List of available plans
   */
  getAvailablePlans: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PLAN.LIST);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching available plans:', error);
      throw error;
    }
  },

  /**
   * Get details of a specific plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Plan details
   */
  getPlanDetails: async (planId) => {
    try {
      const url = ENDPOINTS.PLAN.DETAIL.replace(':id', planId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      throw error;
    }
  },

  /**
   * Get user's current subscriptions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User subscriptions
   */
  getSubscriptions: async (userId) => {
    try {
      const url = ENDPOINTS.SUBSCRIPTION.LIST.replace(':user_id', userId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  /**
   * Subscribe user to a plan
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {boolean} autoRenew - Auto-renewal flag
   * @returns {Promise<Object>} Subscription response
   */
  subscribeToPlan: async (userId, planId, autoRenew = true) => {
    try {
      const url = ENDPOINTS.SUBSCRIPTION.SUBSCRIBE.replace(':user_id', userId);
      const response = await apiClient.post(url, {
        plan_id: planId,
        auto_renew: autoRenew
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  },

  /**
   * Cancel a subscription
   * @param {string} userId - User ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancellation response
   */
  cancelSubscription: async (userId, subscriptionId) => {
    try {
      const url = ENDPOINTS.SUBSCRIPTION.CANCEL
        .replace(':user_id', userId)
        .replace(':subscription_id', subscriptionId);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },
};

export default subscriptionService;

