import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  addNotification,
} from '../store/slices/notificationSlice';

/**
 * Custom hook for managing notification data and actions.
 * Provides an interface to the notification slice.
 */
export default function useNotifications() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading, error } = useSelector(
    (state) => state.notification || {}
  );
  const authUser = useSelector((state) => state.auth?.user);
  const effectiveUserId = authUser?.id || authUser?.user_id || authUser?.sub;

  // --- Action Dispatchers ---

  const fetchNotifications = useCallback(
    (userId) => {
      const uid = userId || effectiveUserId;
      if (!uid) return Promise.reject('No user ID available');
      return dispatch(getNotifications(uid)).unwrap();
    },
    [dispatch, effectiveUserId]
  );

  const markAsRead = useCallback(
    (notificationId) => {
      if (!notificationId) return Promise.reject('Notification ID is required');
      return dispatch(markNotificationAsRead(notificationId)).unwrap();
    },
    [dispatch]
  );

  const markAllAsRead = useCallback(
    (userId) => {
      const uid = userId || effectiveUserId;
      if (!uid) return Promise.reject('No user ID available');
      return dispatch(markAllNotificationsAsRead(uid)).unwrap();
    },
    [dispatch, effectiveUserId]
  );

  const clearAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  const addNew = useCallback(
    (notification) => {
      dispatch(addNotification(notification));
    },
    [dispatch]
  );

  // --- Helper Functions ---

  const getNotificationById = useCallback(
    (notificationId) => {
      return notifications.find(
        (n) => n.id === notificationId || n.notification_id === notificationId
      );
    },
    [notifications]
  );

  const hasUnread = unreadCount > 0;

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNew,

    // Helpers
    getNotificationById,
  };
}

