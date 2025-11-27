import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChargingHistory } from '../store/slices/chargingSlice';
import { logger } from '../utils/logger';

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
  const isMountedRef = useRef(true); // Track component mount state

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Determine user ID from options or auth state
  const effectiveUserId = userId || authUser?.id || authUser?.user_id || authUser?.sub;

  /**
   * Fetch charging history
   */
  const fetchHistory = useCallback(
    async (overrideUserId) => {
      const uid = overrideUserId || effectiveUserId;

      if (!uid) {
        logger.warn('No user ID available to fetch charging history');
        return null;
      }

      try {
        const result = await dispatch(getChargingHistory(uid)).unwrap();
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          return result;
        }
        return null;
      } catch (err) {
        logger.error('Error fetching charging history:', err?.message);
        return null;
      }
    },
    [dispatch, effectiveUserId]
  );

  /**
   * Refresh charging history
   */
  const refresh = useCallback(async () => {
    if (isMountedRef.current) {
      setRefreshing(true);
    }
    await fetchHistory();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
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
  }, [autoFetch, effectiveUserId]);

  return {
    sessions,
    loading,
    error,
    refreshing,
    fetchHistory,
    refresh,
  };
}

