// contexts/ChargingControlProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { ChargingControlContext } from "@/contexts/ChargingControlContext";
import chargingControlService from "@/services/chargingControlService";
import apiClient from "@/api/apiClient";

export const ChargingControlProvider = ({ children }) => {
  // Global error
  const [error, setError] = useState(null);

  // Loading flags
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Caches / State
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [activePoints, setActivePoints] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [invoice, setInvoice] = useState(null);

  // ===== SESSION MANAGEMENT =====

  /**
   * Khởi tạo session mới (khi user cắm xe)
   */
  const initiateSession = useCallback(async (payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.initiateSession(payload);
      const data = res?.data ?? res;
      
      setCurrentSession(data);
      setSessions(prev => [data, ...prev]);
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Bắt đầu sạc sau khi xác nhận
   */
  const startSession = useCallback(async (payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.startSession(payload);
      const data = res?.data ?? res;
      
      setCurrentSession(data);
      setSessions(prev => 
        prev.map(s => 
          (s.id === data.id || s.session_id === data.session_id) ? data : s
        )
      );
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Lấy danh sách điểm sạc đang hoạt động tại trạm
   */
  const getActivePointsByStation = useCallback(async (station_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getActivePointsByStation(station_id);
      const data = res?.data ?? res;
      
      setActivePoints(data);
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Lấy danh sách session của user
   */
  const getUserSessions = useCallback(async (user_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getUserSessions(user_id);
      const data = res?.data ?? res;
      
      setSessions(Array.isArray(data) ? data : []);
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Lấy thông tin chi tiết 1 session
   */
  const getSessionById = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getSessionById(session_id);
      const data = res?.data ?? res;
      
      setCurrentSession(data);
      // Update trong danh sách nếu có
      setSessions(prev => {
        const exists = prev.some(s => 
          s.id === session_id || s.session_id === session_id
        );
        if (exists) {
          return prev.map(s => 
            (s.id === session_id || s.session_id === session_id) ? data : s
          );
        }
        return prev;
      });
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Lấy telemetry (thông số thời gian thực)
   */
  const getTelemetry = useCallback(async (session_id, params = {}) => {
    setLoadingTelemetry(true);
    setError(null);
    try {
      const res = await chargingControlService.getTelemetry(session_id, params);
      const data = res?.data ?? res;
      
      setTelemetry(data);
      
      setLoadingTelemetry(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingTelemetry(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Lấy log events của session
   */
  const getSessionEvents = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getSessionEvents(session_id);
      const data = res?.data ?? res;
      
      setSessionEvents(Array.isArray(data) ? data : []);
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== QUYỀN CAN THIỆP CỦA NHÂN VIÊN =====

  /**
   * Tạm dừng phiên sạc
   */
  const pauseSession = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.pauseSession(session_id);
      const data = res?.data ?? res;
      
      // Update session status
      setCurrentSession(prev => 
        (prev && (prev.id === session_id || prev.session_id === session_id)) 
          ? { ...prev, status: 'paused', ...data } 
          : prev
      );
      setSessions(prev => 
        prev.map(s => 
          (s.id === session_id || s.session_id === session_id)
            ? { ...s, status: 'paused', ...data }
            : s
        )
      );
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Tiếp tục sạc
   */
  const resumeSession = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.resumeSession(session_id);
      const data = res?.data ?? res;
      
      // Update session status
      setCurrentSession(prev => 
        (prev && (prev.id === session_id || prev.session_id === session_id)) 
          ? { ...prev, status: 'active', ...data } 
          : prev
      );
      setSessions(prev => 
        prev.map(s => 
          (s.id === session_id || s.session_id === session_id)
            ? { ...s, status: 'active', ...data }
            : s
        )
      );
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Dừng sạc
   */
  const stopSession = useCallback(async (payload) => {
  setLoadingSession(true);
  setError(null);

  // validate input
  const sessionId = payload?.session_id || payload?.sessionId;
  if (!sessionId) {
    const err = new Error('stopSession: session_id is required');
    setError(err);
    setLoadingSession(false);
    return { success: false, error: err };
  }

  try {
    // Gọi trực tiếp apiClient để avoid service bị lỗi (session_id undefined)
    const res = await apiClient({
      method: 'POST',
      url: `api/v1/charging/${sessionId}/stop`,
      data: payload,
    });

    const data = res?.data ?? res;

    // Cập nhật trạng thái session local (giữ nguyên logic cũ)
    setCurrentSession(prev =>
      (prev && (prev.id === sessionId || prev.session_id === sessionId))
        ? { ...prev, status: 'stopped', ...data }
        : prev
    );

    setSessions(prev =>
      Array.isArray(prev) ? prev.map(s =>
        (s.id === sessionId || s.session_id === sessionId)
          ? { ...s, status: 'stopped', ...data }
          : s
      ) : prev
    );

    setLoadingSession(false);
    return { success: true, data };
  } catch (err) {
    setError(err);
    setLoadingSession(false);
    return { success: false, error: err };
  }
}, [/* add deps if needed */]);

  /**
   * Lấy hóa đơn sau khi kết thúc sạc
   */
  const getInvoiceBySession = useCallback(async (session_id) => {
    setLoadingInvoice(true);
    setError(null);
    try {
      const res = await chargingControlService.getInvoiceBySession(session_id);
      const data = res?.data ?? res;
      
      setInvoice(data);
      
      setLoadingInvoice(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingInvoice(false);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Điều chỉnh session nếu có lỗi (reconcile)
   */
  const reconcileSession = useCallback(async (session_id, payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.reconcileSession(session_id, payload);
      const data = res?.data ?? res;
      
      // Update session sau khi reconcile
      setCurrentSession(prev => 
        (prev && (prev.id === session_id || prev.session_id === session_id)) 
          ? { ...prev, ...data } 
          : prev
      );
      setSessions(prev => 
        prev.map(s => 
          (s.id === session_id || s.session_id === session_id)
            ? { ...s, ...data }
            : s
        )
      );
      
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear current session
   */
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  /**
   * Refresh session data
   */
  const refreshSession = useCallback(async (session_id) => {
    const result = await getSessionById(session_id);
    if (result.success) {
      // Optionally refresh telemetry and events
      await getTelemetry(session_id);
      await getSessionEvents(session_id);
    }
    return result;
  }, [getSessionById, getTelemetry, getSessionEvents]);

  // Memoize context value
  const value = useMemo(
    () => ({
      // State
      error,
      loadingSession,
      loadingTelemetry,
      loadingInvoice,
      sessions,
      currentSession,
      activePoints,
      telemetry,
      sessionEvents,
      invoice,

      // Session Management
      initiateSession,
      startSession,
      getActivePointsByStation,
      getUserSessions,
      getSessionById,
      getTelemetry,
      getSessionEvents,

      // Staff Controls
      pauseSession,
      resumeSession,
      stopSession,
      getInvoiceBySession,
      reconcileSession,

      // Utilities
      clearError,
      clearCurrentSession,
      refreshSession,

      // Setters (for manual updates if needed)
      setSessions,
      setCurrentSession,
      setActivePoints,
      setTelemetry,
      setSessionEvents,
      setInvoice,
    }),
    [
      error,
      loadingSession,
      loadingTelemetry,
      loadingInvoice,
      sessions,
      currentSession,
      activePoints,
      telemetry,
      sessionEvents,
      invoice,
      initiateSession,
      startSession,
      getActivePointsByStation,
      getUserSessions,
      getSessionById,
      getTelemetry,
      getSessionEvents,
      pauseSession,
      resumeSession,
      stopSession,
      getInvoiceBySession,
      reconcileSession,
      clearError,
      clearCurrentSession,
      refreshSession,
    ]
  );

  return (
    <ChargingControlContext.Provider value={value}>
      {children}
    </ChargingControlContext.Provider>
  );
};

export default ChargingControlProvider;