import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

// Async thunk for fetching notifications
export const getNotifications = createAsyncThunk(
  'notification/getNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const url = ENDPOINTS.NOTIFICATION.LIST.replace(':user_id', userId);
      const response = await apiClient.get(url);
      const notifications = response?.data?.notifications || response?.notifications || response?.data || response || [];
      return Array.isArray(notifications) ? notifications : [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for marking a notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const url = ENDPOINTS.NOTIFICATION.MARK_READ.replace(':notification_id', notificationId);
      await apiClient.put(url);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Async thunk for marking all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (userId, { rejectWithValue }) => {
    try {
      const url = ENDPOINTS.NOTIFICATION.MARK_ALL_READ.replace(':user_id', userId);
      await apiClient.put(url);
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    },
    addNotification(state, action) {
      // Add a new notification (e.g., from push notification)
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Notifications
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read && !n.is_read).length;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notifications';
      })

      // Mark Notification as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          n => n.id === action.payload || n.notification_id === action.payload
        );
        if (notification && !notification.read && !notification.is_read) {
          notification.read = true;
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to mark notification as read';
      })

      // Mark All Notifications as Read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
          notification.is_read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to mark all notifications as read';
      });
  },
});

export const { clearNotifications, addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
