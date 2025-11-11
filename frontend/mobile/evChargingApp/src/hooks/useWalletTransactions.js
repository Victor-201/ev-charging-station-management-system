import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTransactions } from '../store/slices/walletSlice';

/**
 * Custom hook for managing wallet transactions
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to automatically fetch transactions on mount
 * @param {string} options.userId - User ID to fetch transactions for
 * @param {Object} options.params - Additional query parameters (e.g., type filter)
 * @returns {Object} Transaction data and methods
 */
export default function useWalletTransactions(options = {}) {
  const { autoFetch = false, userId = null, params = {} } = options;

  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector((state) => state.wallet || {});
  const authUser = useSelector((state) => state.auth?.user);

  const [refreshing, setRefreshing] = useState(false);

  // Determine user ID from options or auth state
  const effectiveUserId = userId || authUser?.id || authUser?.user_id || authUser?.sub;

  /**
   * Fetch wallet transactions
   */
  const fetchTransactions = useCallback(
    async (overrideUserId, overrideParams) => {
      const uid = overrideUserId || effectiveUserId;
      const queryParams = overrideParams || params;

      if (!uid) {
        console.warn('No user ID available to fetch wallet transactions');
        return null;
      }

      try {
        const result = await dispatch(
          getTransactions({ userId: uid, params: queryParams })
        ).unwrap();
        return result;
      } catch (err) {
        console.error('Error fetching wallet transactions:', err);
        return null;
      }
    },
    [dispatch, effectiveUserId, params]
  );

  /**
   * Refresh wallet transactions
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch && effectiveUserId) {
      fetchTransactions();
    }
  }, [autoFetch, effectiveUserId, fetchTransactions]);

  return {
    transactions: transactions || [],
    loading,
    error,
    refreshing,
    fetchTransactions,
    refresh,
  };
}

