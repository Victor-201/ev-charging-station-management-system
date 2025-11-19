import { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAvailableSlots,
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  previewReservationCost,
  finalizeReservation,
  clearReservationState,
  clearCurrentReservation,
  clearAvailableSlots,
  setAvailableSlots,
} from '../store/slices/reservationSlice';

/**
 * Custom hook for managing reservation data and actions.
 * Provides an interface to the reservation slice.
 */
export default function useReservations() {
  const dispatch = useDispatch();
  const slotsCache = useRef({}); // Cache for available slots
  const {
    reservations,
    currentReservation,
    availableSlots,
    costPreview,
    loading,
    slotsLoading,
    error,
  } = useSelector((state) => state.reservation || {});

  const authUser = useSelector((state) => state.auth?.user);
  const effectiveUserId = authUser?.id || authUser?.user_id || authUser?.sub;

  // --- Action Dispatchers ---

  const fetchAvailableSlots = useCallback(
    (stationId, date) => {
      const cacheKey = `${stationId}-${date}`;
      const cachedData = slotsCache.current[cacheKey];
      const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

      // Check if valid cache exists
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('✅ Using cached slots for', cacheKey);
        dispatch(setAvailableSlots(cachedData.slots));
        return Promise.resolve(cachedData.slots);
      }

      console.log('⬇️ Fetching new slots for', cacheKey);
      // No valid cache, fetch from network
      return dispatch(getAvailableSlots({ stationId, date }))
        .unwrap()
        .then((slots) => {
          // Update cache on successful fetch
          slotsCache.current[cacheKey] = {
            slots,
            timestamp: Date.now(),
          };
          return slots;
        });
    },
    [dispatch]
  );

  const createNewReservation = useCallback(
    (reservationData) => {
      return dispatch(createReservation(reservationData)).unwrap();
    },
    [dispatch]
  );

  const fetchUserReservations = useCallback(
    (userId) => {
      const uid = userId || effectiveUserId;
      if (!uid) return Promise.reject('No user ID available');
      return dispatch(getUserReservations(uid)).unwrap();
    },
    [dispatch, effectiveUserId]
  );

  const fetchReservationById = useCallback(
    (reservationId) => {
      return dispatch(getReservationById(reservationId)).unwrap();
    },
    [dispatch]
  );

  const cancelUserReservation = useCallback(
    (reservationId) => {
      return dispatch(cancelReservation(reservationId)).unwrap();
    },
    [dispatch]
  );

  const previewCost = useCallback(
    (reservationId) => {
      return dispatch(previewReservationCost(reservationId)).unwrap();
    },
    [dispatch]
  );

  const finalizeUserReservation = useCallback(
    (reservationId) => {
      return dispatch(finalizeReservation(reservationId)).unwrap();
    },
    [dispatch]
  );

  // --- State Clearing ---

  const clearState = useCallback(() => {
    dispatch(clearReservationState());
  }, [dispatch]);

  const clearCurrent = useCallback(() => {
    dispatch(clearCurrentReservation());
  }, [dispatch]);

  const clearSlots = useCallback(() => {
    dispatch(clearAvailableSlots());
  }, [dispatch]);

  return {
    // State
    reservations,
    currentReservation,
    availableSlots,
    costPreview,
    loading,
    slotsLoading,
    error,

    // Actions
    fetchAvailableSlots,
    createNewReservation,
    fetchUserReservations,
    fetchReservationById,
    cancelUserReservation,
    previewCost,
    finalizeUserReservation,

    // Cleanup
    clearState,
    clearCurrent,
    clearSlots,
  };
}

