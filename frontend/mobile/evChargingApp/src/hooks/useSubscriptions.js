import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAvailablePlans,
  getSubscriptions,
  subscribeToPlan,
  cancelSubscription,
} from '../store/slices/subscriptionSlice';

/**
 * Custom hook for managing subscriptions
 * Provides access to subscription state and actions
 * 
 * @param {Object} options
 * @param {string} options.userId - User ID to fetch subscriptions for
 * @param {boolean} options.autoFetch - Auto-fetch subscriptions on mount
 * @returns {Object} Subscription state and actions
 */
const useSubscriptions = ({ userId, autoFetch = true } = {}) => {
  const dispatch = useDispatch();
  const {
    availablePlans,
    subscriptions,
    plansLoading,
    subscriptionsLoading,
    loading,
    plansError,
    subscriptionsError,
    error,
  } = useSelector((state) => state.subscriptions);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(getAvailablePlans());
      if (userId) {
        dispatch(getSubscriptions(userId));
      }
    }
  }, [autoFetch, dispatch, userId]);

  // Fetch plans
  const fetchPlans = useCallback(() => {
    return dispatch(getAvailablePlans()).unwrap();
  }, [dispatch]);

  // Fetch user subscriptions
  const fetchSubscriptions = useCallback(() => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    return dispatch(getSubscriptions(userId)).unwrap();
  }, [dispatch, userId]);

  // Subscribe to a plan
  const subscribe = useCallback(
    (planId, autoRenew = true) => {
      if (!userId) return Promise.reject(new Error('User ID is required'));
      return dispatch(subscribeToPlan({ userId, planId, autoRenew })).unwrap();
    },
    [dispatch, userId]
  );

  // Cancel a subscription
  const cancel = useCallback(
    (subscriptionId) => {
      if (!userId) return Promise.reject(new Error('User ID is required'));
      return dispatch(cancelSubscription({ userId, subscriptionId })).unwrap();
    },
    [dispatch, userId]
  );

  // Get active subscription
  const getActiveSubscription = useCallback(() => {
    return subscriptions?.find(
      (sub) => sub.status === 'active' || sub.status === 'ACTIVE'
    );
  }, [subscriptions]);

  // Check if user has active subscription for a plan
  const hasActiveSubscription = useCallback(
    (planId) => {
      return subscriptions?.some(
        (sub) =>
          sub.plan_id === planId &&
          (sub.status === 'active' || sub.status === 'ACTIVE')
      );
    },
    [subscriptions]
  );

  return {
    // State
    availablePlans,
    subscriptions,
    plansLoading,
    subscriptionsLoading,
    loading,
    plansError,
    subscriptionsError,
    error,

    // Actions
    fetchPlans,
    fetchSubscriptions,
    subscribe,
    cancel,
    getActiveSubscription,
    hasActiveSubscription,
  };
};

export default useSubscriptions;

