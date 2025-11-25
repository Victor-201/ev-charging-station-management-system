import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChargingHistory } from '../store/slices/chargingSlice';

/**
 * Custom hook for managing charging history
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to automatically fetch history on mount
 * @param {string} options.userId - User ID to fetch history for
 * @returns {Object} Charging history data and methods
 */
export default function useChargingHistory(options = {}) {
  const { autoFetch = false, userId = null } = options;

  const dispatch = useDispatch();
  const { sessions, loading, error } = useSelector((state) => state.charging);
  const authUser = useSelector((state) => state.auth?.user);

  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false); // Track if we've already fetched

  // Determine user ID from options or auth state
  const effectiveUserId = userId || authUser?.id || authUser?.user_id || authUser?.sub;

  /**
   * Fetch charging history
   */
  const fetchHistory = useCallback(
    async (overrideUserId) => {
      const uid = overrideUserId || effectiveUserId;
      
      if (!uid) {
        console.warn('No user ID available to fetch charging history');
        return null;
      }

      try {
        const result = await dispatch(getChargingHistory(uid)).unwrap();
        return result;
      } catch (err) {
        console.error('Error fetching charging history:', err);
        return null;
      }
    },
    [dispatch, effectiveUserId]
  );

  /**
   * Refresh charging history
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  /**
   * Auto-fetch on mount if enabled
   * Only fetch once on mount to prevent continuous requests
   */
  useEffect(() => {
    if (autoFetch && effectiveUserId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return {
    sessions,
    loading,
    error,
    refreshing,
    fetchHistory,
    refresh,
  };
}

