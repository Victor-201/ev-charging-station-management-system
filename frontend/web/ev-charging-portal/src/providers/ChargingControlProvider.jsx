// contexts/ChargingControlProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { ChargingControlContext } from "@/contexts/ChargingControlContext";
import chargingControlService from "@/services/chargingControlService"; // sửa path nếu cần

export const ChargingControlProvider = ({ children }) => {
  // global error
  const [error, setError] = useState(null);

  // loading flags grouped by domain
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingNotification, setLoadingNotification] = useState(false);

  // caches / last results
  const [lastBooking, setLastBooking] = useState(null);
  const [bookings, setBookings] = useState([]); // optional list cache
  const [userReservations, setUserReservations] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [lastQr, setLastQr] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  // ===== BOOKING =====
  const createBooking = useCallback(async (payload) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.createBooking(payload);
      const data = res?.data ?? res;
      setLastBooking(data);
      setBookings(prev => (prev ? [data, ...prev] : [data]));
      setLoadingBooking(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, []);

  const checkAvailability = useCallback(async (params) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.checkAvailability(params);
      const data = res?.data ?? res;
      setLoadingBooking(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, []);

  const getBookingById = useCallback(async (reservation_id) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.getBookingById(reservation_id);
      const data = res?.data ?? res;
      // optionally update bookings / lastBooking
      setLastBooking(data);
      setLoadingBooking(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, []);

  const updateBooking = useCallback(async (reservation_id, payload) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.updateBooking(reservation_id, payload);
      const data = res?.data ?? res;
      setBookings(prev => prev?.map(b => (b.id === reservation_id || b.reservation_id === reservation_id ? data : b)) ?? prev);
      setLastBooking(data);
      setLoadingBooking(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, []);

  // inside ChargingControlProvider (add these functions near other session functions)

  // FETCH SESSIONS BY STATION (aggregator)
  // Prefer backend: GET /api/v1/charging?station_id={station_id}&status=...
  // Fallback: call connectors -> for each connector call a session lookup endpoint (not ideal)
  const fetchSessionsByStation = useCallback(async (station_id, params = {}) => {
    setLoadingSession(true);
    setError(null);
    try {
      // chargingControlService.getSessions should call /api/v1/charging?station_id=...
      const res = await chargingControlService.getSessions({ station_id, ...params });
      const data = res?.data ?? res;
      // expected data.items or data array
      const items = data?.items ?? data;
      setSessions(items);
      setLoadingSession(false);
      return { success: true, data: items };
    } catch (err) {
      // fallback: try connectors -> attempt to fetch sessions per connector (if your backend supports)
      try {
        // stationService used from StationProvider; if not accessible here, upstream caller can do fallback
      } catch (e) {}
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const cancelBooking = useCallback(async (reservation_id) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.cancelBooking(reservation_id);
      setBookings(prev => prev?.filter(b => b.id !== reservation_id && b.reservation_id !== reservation_id) ?? prev);
      if (lastBooking && (lastBooking.id === reservation_id || lastBooking.reservation_id === reservation_id)) setLastBooking(null);
      setLoadingBooking(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, [lastBooking]);

  const joinWaitlist = useCallback(async (payload) => {
    setLoadingWaitlist(true);
    setError(null);
    try {
      const res = await chargingControlService.joinWaitlist(payload);
      const data = res?.data ?? res;
      setWaitlists(prev => (prev ? [data, ...prev] : [data]));
      setLoadingWaitlist(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWaitlist(false);
      return { success: false, error: err };
    }
  }, []);

  const getUserReservations = useCallback(async (user_id) => {
    setLoadingBooking(true);
    setError(null);
    try {
      const res = await chargingControlService.getUserReservations(user_id);
      const data = res?.data ?? res;
      setUserReservations(data);
      setLoadingBooking(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingBooking(false);
      return { success: false, error: err };
    }
  }, []);

  const updateWaitlistStatus = useCallback(async (waitlist_id, payload) => {
    setLoadingWaitlist(true);
    setError(null);
    try {
      const res = await chargingControlService.updateWaitlistStatus(waitlist_id, payload);
      const data = res?.data ?? res;
      setWaitlists(prev => prev?.map(w => (w.id === waitlist_id || w.waitlist_id === waitlist_id ? data : w)) ?? prev);
      setLoadingWaitlist(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWaitlist(false);
      return { success: false, error: err };
    }
  }, []);

  const getWaitlistByStation = useCallback(async (station_id) => {
    setLoadingWaitlist(true);
    setError(null);
    try {
      const res = await chargingControlService.getWaitlistByStation(station_id);
      const data = res?.data ?? res;
      setWaitlists(data);
      setLoadingWaitlist(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWaitlist(false);
      return { success: false, error: err };
    }
  }, []);

  const deleteWaitlist = useCallback(async (waitlist_id) => {
    setLoadingWaitlist(true);
    setError(null);
    try {
      const res = await chargingControlService.deleteWaitlist(waitlist_id);
      setWaitlists(prev => prev?.filter(w => w.id !== waitlist_id && w.waitlist_id !== waitlist_id) ?? prev);
      setLoadingWaitlist(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoadingWaitlist(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== QR =====
  const generateQr = useCallback(async (payload) => {
    setLoadingQr(true);
    setError(null);
    try {
      const res = await chargingControlService.generateQr(payload);
      const data = res?.data ?? res;
      setLastQr(data);
      setLoadingQr(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingQr(false);
      return { success: false, error: err };
    }
  }, []);

  const validateQr = useCallback(async (qr_id) => {
    setLoadingQr(true);
    setError(null);
    try {
      const res = await chargingControlService.validateQr(qr_id);
      const data = res?.data ?? res;
      setLoadingQr(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingQr(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== SESSION =====
  const initiateSession = useCallback(async (payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.initiateSession(payload);
      const data = res?.data ?? res;
      setSessions(prev => (prev ? [data, ...prev] : [data]));
      setCurrentSession(data);
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const startSession = useCallback(async (payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.startSession(payload);
      const data = res?.data ?? res;
      setCurrentSession(data);
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const pushMeterReading = useCallback(async (session_id, payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.pushMeterReading(session_id, payload);
      const data = res?.data ?? res;
      // optionally update session in sessions cache
      setSessions(prev => prev?.map(s => (s.id === session_id || s.session_id === session_id ? data : s)) ?? prev);
      setCurrentSession(prev => (prev && (prev.id === session_id || prev.session_id === session_id) ? data : prev));
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const getTelemetry = useCallback(async (session_id, params) => {
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

  const pauseSession = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.pauseSession(session_id);
      const data = res?.data ?? res;
      setCurrentSession(prev => (prev && (prev.id === session_id || prev.session_id === session_id) ? data : prev));
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const resumeSession = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.resumeSession(session_id);
      const data = res?.data ?? res;
      setCurrentSession(prev => (prev && (prev.id === session_id || prev.session_id === session_id) ? data : prev));
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const stopSession = useCallback(async (payload) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.stopSession(payload);
      const data = res?.data ?? res;
      // optional: update sessions / currentSession
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const getSessionById = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getSessionById(session_id);
      const data = res?.data ?? res;
      setCurrentSession(data);
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  const getSessionEvents = useCallback(async (session_id) => {
    setLoadingSession(true);
    setError(null);
    try {
      const res = await chargingControlService.getSessionEvents(session_id);
      const data = res?.data ?? res;
      setLoadingSession(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSession(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== NOTIFICATION (gateway) =====
  const sendNotification = useCallback(async (payload) => {
    setLoadingNotification(true);
    setError(null);
    try {
      const res = await chargingControlService.sendNotification(payload);
      const data = res?.data ?? res;
      setLoadingNotification(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotification(false);
      return { success: false, error: err };
    }
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      // errors & flags
      error,
      loadingBooking,
      loadingWaitlist,
      loadingQr,
      loadingSession,
      loadingTelemetry,
      loadingNotification,

      // caches
      lastBooking,
      bookings,
      userReservations,
      waitlists,
      lastQr,
      sessions,
      currentSession,
      telemetry,

      // booking actions
      createBooking,
      checkAvailability,
      getBookingById,
      updateBooking,
      cancelBooking,
      joinWaitlist,
      getUserReservations,
      updateWaitlistStatus,
      getWaitlistByStation,
      deleteWaitlist,

      // qr
      generateQr,
      validateQr,

      // session
      initiateSession,
      startSession,
      pushMeterReading,
      getTelemetry,
      pauseSession,
      resumeSession,
      stopSession,
      getSessionById,
      getSessionEvents,

      // notifications
      sendNotification,

      // optional setters
      setLastBooking,
      setBookings,
      setUserReservations,
      setWaitlists,
      setLastQr,
      setSessions,
      setCurrentSession,
      setTelemetry,
    }),
    [
      error,
      loadingBooking,
      loadingWaitlist,
      loadingQr,
      loadingSession,
      loadingTelemetry,
      loadingNotification,
      lastBooking,
      bookings,
      userReservations,
      waitlists,
      lastQr,
      sessions,
      currentSession,
      telemetry,
      // callbacks stable due to useCallback, but included for clarity
      createBooking,
      checkAvailability,
      getBookingById,
      updateBooking,
      cancelBooking,
      joinWaitlist,
      getUserReservations,
      updateWaitlistStatus,
      getWaitlistByStation,
      deleteWaitlist,
      generateQr,
      validateQr,
      initiateSession,
      startSession,
      pushMeterReading,
      getTelemetry,
      pauseSession,
      resumeSession,
      stopSession,
      getSessionById,
      getSessionEvents,
      sendNotification,
    ]
  );

  return <ChargingControlContext.Provider value={value}>{children}</ChargingControlContext.Provider>;
};
