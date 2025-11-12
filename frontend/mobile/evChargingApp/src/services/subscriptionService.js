import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const subscriptionService = {
  getSubscriptions: async (userId) => {
    const url = ENDPOINTS.SUBSCRIPTION.LIST.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  subscribeToPlan: async (userId, planId) => {
    const url = ENDPOINTS.SUBSCRIPTION.SUBSCRIBE.replace(':user_id', userId);
    const response = await apiClient.post(url, { planId });
    return response.data;
  },

  cancelSubscription: async (userId, subscriptionId) => {
    const url = ENDPOINTS.SUBSCRIPTION.CANCEL.replace(':user_id', userId).replace(':subscription_id', subscriptionId);
    const response = await apiClient.post(url);
    return response.data;
  },
};

export default subscriptionService;

