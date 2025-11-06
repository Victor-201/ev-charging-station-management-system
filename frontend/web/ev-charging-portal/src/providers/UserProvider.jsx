// contexts/UserProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { UserContext } from "@/context/UserContext";
import userService from "@/services/userService"; // sửa path nếu cần

export const UserProvider = ({ children }) => {
  // global error
  const [error, setError] = useState(null);

  // loading flags grouped (tách theo domain để UI dễ quản lý)
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // cached data
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]); // list
  const [currentUser, setCurrentUser] = useState(null);
  const [vehicles, setVehicles] = useState([]); // last fetched user's vehicles
  const [subscriptions, setSubscriptions] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffStats, setStaffStats] = useState(null);

  // ===== USER =====
  const getProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await userService.getProfile();
      const data = res?.data ?? res;
      setProfile(data);
      setLoadingProfile(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingProfile(false);
      return { success: false, error: err };
    }
  }, []);

  const getAll = useCallback(async (params) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.getAll(params);
      const data = res?.data ?? res;
      setUsers(data);
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, []);

  const getById = useCallback(async (user_id) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.getById(user_id);
      const data = res?.data ?? res;
      setCurrentUser(data);
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, []);

  const update = useCallback(async (user_id, payload) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.update(user_id, payload);
      const data = res?.data ?? res;
      // update caches: users list and currentUser/profile if applicable
      setUsers(prev => prev?.map(u => (u.id === data.id || u.user_id === data.user_id ? data : u)) ?? prev);
      setCurrentUser(prev => (prev && (prev.id === data.id || prev.user_id === data.user_id) ? data : prev));
      setProfile(prev => (prev && (prev.id === data.id || prev.user_id === data.user_id) ? data : prev));
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, []);

  const changePassword = useCallback(async (user_id, payload) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.changePassword(user_id, payload);
      const data = res?.data ?? res;
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, []);

  const deactivate = useCallback(async (user_id) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.deactivate(user_id);
      const data = res?.data ?? res;
      // remove from users cache
      setUsers(prev => prev?.filter(u => u.id !== user_id && u.user_id !== user_id) ?? prev);
      if (currentUser && (currentUser.id === user_id || currentUser.user_id === user_id)) {
        setCurrentUser(null);
      }
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, [currentUser]);

  const exportData = useCallback(async (user_id) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.exportData(user_id);
      const data = res?.data ?? res;
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, []);

  const erase = useCallback(async (user_id) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await userService.erase(user_id);
      const data = res?.data ?? res;
      setUsers(prev => prev?.filter(u => u.id !== user_id && u.user_id !== user_id) ?? prev);
      if (profile && (profile.id === user_id || profile.user_id === user_id)) setProfile(null);
      if (currentUser && (currentUser.id === user_id || currentUser.user_id === user_id)) setCurrentUser(null);
      setLoadingUsers(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingUsers(false);
      return { success: false, error: err };
    }
  }, [profile, currentUser]);

  // ===== VEHICLE =====
  const addVehicle = useCallback(async (user_id, payload) => {
    setLoadingVehicles(true);
    setError(null);
    try {
      const res = await userService.addVehicle(user_id, payload);
      const data = res?.data ?? res;
      setVehicles(prev => (prev ? [data, ...prev] : [data]));
      setLoadingVehicles(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingVehicles(false);
      return { success: false, error: err };
    }
  }, []);

  const getVehicles = useCallback(async (user_id) => {
    setLoadingVehicles(true);
    setError(null);
    try {
      const res = await userService.getVehicles(user_id);
      const data = res?.data ?? res;
      setVehicles(data);
      setLoadingVehicles(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingVehicles(false);
      return { success: false, error: err };
    }
  }, []);

  const getVehicleById = useCallback(async (vehicle_id) => {
    setLoadingVehicles(true);
    setError(null);
    try {
      const res = await userService.getVehicleById(vehicle_id);
      const data = res?.data ?? res;
      setLoadingVehicles(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingVehicles(false);
      return { success: false, error: err };
    }
  }, []);

  const updateVehicle = useCallback(async (vehicle_id, payload) => {
    setLoadingVehicles(true);
    setError(null);
    try {
      const res = await userService.updateVehicle(vehicle_id, payload);
      const data = res?.data ?? res;
      setVehicles(prev => prev?.map(v => (v.id === data.id || v.vehicle_id === data.vehicle_id ? data : v)) ?? prev);
      setLoadingVehicles(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingVehicles(false);
      return { success: false, error: err };
    }
  }, []);

  const deleteVehicle = useCallback(async (vehicle_id) => {
    setLoadingVehicles(true);
    setError(null);
    try {
      const res = await userService.deleteVehicle(vehicle_id);
      setVehicles(prev => prev?.filter(v => v.id !== vehicle_id && v.vehicle_id !== vehicle_id) ?? prev);
      setLoadingVehicles(false);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      setError(err);
      setLoadingVehicles(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== SUBSCRIPTION =====
  const getSubscriptions = useCallback(async (user_id) => {
    setLoadingSubscriptions(true);
    setError(null);
    try {
      const res = await userService.getSubscriptions(user_id);
      const data = res?.data ?? res;
      setSubscriptions(data);
      setLoadingSubscriptions(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSubscriptions(false);
      return { success: false, error: err };
    }
  }, []);

  const createSubscription = useCallback(async (user_id, payload) => {
    setLoadingSubscriptions(true);
    setError(null);
    try {
      const res = await userService.createSubscription(user_id, payload);
      const data = res?.data ?? res;
      setLoadingSubscriptions(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSubscriptions(false);
      return { success: false, error: err };
    }
  }, []);

  const cancelSubscription = useCallback(async (user_id, subscription_id) => {
    setLoadingSubscriptions(true);
    setError(null);
    try {
      const res = await userService.cancelSubscription(user_id, subscription_id);
      const data = res?.data ?? res;
      setLoadingSubscriptions(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSubscriptions(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== WALLET =====
  const walletTopupCallback = useCallback(async (user_id, payload) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await userService.walletTopupCallback(user_id, payload);
      const data = res?.data ?? res;
      setLoadingWallet(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWallet(false);
      return { success: false, error: err };
    }
  }, []);

  const withdraw = useCallback(async (user_id, payload) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await userService.withdraw(user_id, payload);
      const data = res?.data ?? res;
      setLoadingWallet(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWallet(false);
      return { success: false, error: err };
    }
  }, []);

  const getTransactions = useCallback(async (user_id) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await userService.getTransactions(user_id);
      const data = res?.data ?? res;
      setWalletTransactions(data);
      setLoadingWallet(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWallet(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== NOTIFICATIONS =====
  const getNotifications = useCallback(async (user_id) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.getNotifications(user_id);
      const data = res?.data ?? res;
      setNotifications(data);
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const sendNotification = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.sendNotification(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const scheduleNotification = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.scheduleNotification(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const bookingWebhook = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.bookingWebhook(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const registerFCM = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.registerFCM(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const removeFCM = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.removeFCM(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const testFCM = useCallback(async (payload) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.testFCM(payload);
      const data = res?.data ?? res;
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const markAsRead = useCallback(async (notification_id) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.markAsRead(notification_id);
      const data = res?.data ?? res;
      // optionally update notifications cache (mark read locally)
      setNotifications(prev => prev?.map(n => (n.id === notification_id || n.notification_id === notification_id ? { ...n, read: true } : n)) ?? prev);
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  const markAllRead = useCallback(async (user_id) => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const res = await userService.markAllRead(user_id);
      const data = res?.data ?? res;
      setNotifications(prev => prev?.map(n => ({ ...n, read: true })) ?? prev);
      setLoadingNotifications(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingNotifications(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== STAFF MANAGEMENT =====
  const getAllStaff = useCallback(async (params) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getAllStaff(params);
      const data = res?.data ?? res;
      setStaffList(data);
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffStatistics = useCallback(async () => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffStatistics();
      const data = res?.data ?? res;
      setStaffStats(data);
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffByStation = useCallback(async (station_id) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffByStation(station_id);
      const data = res?.data ?? res;
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffByUser = useCallback(async (user_id) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffByUser(user_id);
      const data = res?.data ?? res;
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffById = useCallback(async (staff_id) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffById(staff_id);
      const data = res?.data ?? res;
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffAttendance = useCallback(async (staff_id) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffAttendance(staff_id);
      const data = res?.data ?? res;
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  const getStaffAttendanceSummary = useCallback(async (staff_id) => {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await userService.getStaffAttendanceSummary(staff_id);
      const data = res?.data ?? res;
      setLoadingStaff(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingStaff(false);
      return { success: false, error: err };
    }
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      // errors & flags
      error,
      loadingProfile,
      loadingUsers,
      loadingVehicles,
      loadingSubscriptions,
      loadingWallet,
      loadingNotifications,
      loadingStaff,

      // caches
      profile,
      users,
      currentUser,
      vehicles,
      subscriptions,
      walletTransactions,
      notifications,
      staffList,
      staffStats,

      // user actions
      getProfile,
      getAll,
      getById,
      update,
      changePassword,
      deactivate,
      exportData,
      erase,

      // vehicle actions
      addVehicle,
      getVehicles,
      getVehicleById,
      updateVehicle,
      deleteVehicle,

      // subscription actions
      getSubscriptions,
      createSubscription,
      cancelSubscription,

      // wallet actions
      walletTopupCallback,
      withdraw,
      getTransactions,

      // notifications
      getNotifications,
      sendNotification,
      scheduleNotification,
      bookingWebhook,
      registerFCM,
      removeFCM,
      testFCM,
      markAsRead,
      markAllRead,

      // staff
      getAllStaff,
      getStaffStatistics,
      getStaffByStation,
      getStaffByUser,
      getStaffById,
      getStaffAttendance,
      getStaffAttendanceSummary,

      // optional setters for manual cache updates
      setProfile,
      setUsers,
      setCurrentUser,
      setVehicles,
      setSubscriptions,
      setWalletTransactions,
      setNotifications,
      setStaffList,
      setStaffStats,
    }),
    [
      error,
      loadingProfile,
      loadingUsers,
      loadingVehicles,
      loadingSubscriptions,
      loadingWallet,
      loadingNotifications,
      loadingStaff,
      profile,
      users,
      currentUser,
      vehicles,
      subscriptions,
      walletTransactions,
      notifications,
      staffList,
      staffStats,
      // functions are stable (useCallback) so not required, but included for clarity
      getProfile,
      getAll,
      getById,
      update,
      changePassword,
      deactivate,
      exportData,
      erase,
      addVehicle,
      getVehicles,
      getVehicleById,
      updateVehicle,
      deleteVehicle,
      getSubscriptions,
      createSubscription,
      cancelSubscription,
      walletTopupCallback,
      withdraw,
      getTransactions,
      getNotifications,
      sendNotification,
      scheduleNotification,
      bookingWebhook,
      registerFCM,
      removeFCM,
      testFCM,
      markAsRead,
      markAllRead,
      getAllStaff,
      getStaffStatistics,
      getStaffByStation,
      getStaffByUser,
      getStaffById,
      getStaffAttendance,
      getStaffAttendanceSummary,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
