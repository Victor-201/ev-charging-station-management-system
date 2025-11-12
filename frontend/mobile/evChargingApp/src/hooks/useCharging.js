import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  getChargingHistory,
  initiateCharging,
  startCharging,
  stopCharging,
  pauseCharging,
  resumeCharging,
  getSessionDetail,
  getSessionTelemetry,
  getInvoice,
  confirmPayment,
  clearChargingState,
  clearError,
  updateTelemetry,
  setActiveSession,
} from '../store/slices/chargingSlice';

const useCharging = () => {
  const dispatch = useDispatch();
  const {
    sessions,
    activeSession,
    currentSession,
    telemetry,
    invoice,
    loading,
    error,
    historyLoading,
    telemetryLoading,
    invoiceLoading,
  } = useSelector((state) => state.charging);

  // Fetch charging history
  const fetchHistory = useCallback(
    (userId, params) => {
      return dispatch(getChargingHistory({ userId, params }));
    },
    [dispatch]
  );

  // Initiate charging session from reservation
  const initiate = useCallback(
    (reservationId) => {
      return dispatch(initiateCharging(reservationId));
    },
    [dispatch]
  );

  // Start charging
  const start = useCallback(
    (sessionId) => {
      return dispatch(startCharging(sessionId));
    },
    [dispatch]
  );

  // Stop charging
  const stop = useCallback(
    (sessionId) => {
      return dispatch(stopCharging(sessionId));
    },
    [dispatch]
  );

  // Pause charging
  const pause = useCallback(
    (sessionId) => {
      return dispatch(pauseCharging(sessionId));
    },
    [dispatch]
  );

  // Resume charging
  const resume = useCallback(
    (sessionId) => {
      return dispatch(resumeCharging(sessionId));
    },
    [dispatch]
  );

  // Get session detail
  const getSession = useCallback(
    (sessionId) => {
      return dispatch(getSessionDetail(sessionId));
    },
    [dispatch]
  );

  // Get session telemetry
  const getTelemetry = useCallback(
    (sessionId) => {
      return dispatch(getSessionTelemetry(sessionId));
    },
    [dispatch]
  );

  // Get invoice
  const fetchInvoice = useCallback(
    (sessionId) => {
      return dispatch(getInvoice(sessionId));
    },
    [dispatch]
  );

  // Confirm payment
  const confirmSessionPayment = useCallback(
    (sessionId, paymentData) => {
      return dispatch(confirmPayment({ sessionId, paymentData }));
    },
    [dispatch]
  );

  // Clear state
  const clearState = useCallback(() => {
    dispatch(clearChargingState());
  }, [dispatch]);

  // Clear error
  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Update telemetry (for real-time updates)
  const updateTelemetryData = useCallback(
    (telemetryData) => {
      dispatch(updateTelemetry(telemetryData));
    },
    [dispatch]
  );

  // Set active session
  const setActive = useCallback(
    (session) => {
      dispatch(setActiveSession(session));
    },
    [dispatch]
  );

  return {
    // State
    sessions,
    activeSession,
    currentSession,
    telemetry,
    invoice,
    loading,
    error,
    historyLoading,
    telemetryLoading,
    invoiceLoading,

    // Actions
    fetchHistory,
    initiate,
    start,
    stop,
    pause,
    resume,
    getSession,
    getTelemetry,
    fetchInvoice,
    confirmSessionPayment,
    clearState,
    clearErrorState,
    updateTelemetryData,
    setActive,
  };
};

export default useCharging;

