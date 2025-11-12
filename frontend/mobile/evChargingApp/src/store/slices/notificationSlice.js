import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

// Async thunks for notifications
export const getNotifications = createAsyncThunk('notification/getNotifications', async (userId, { rejectWithValue }) => {
  try {
    const response = await notificationService.getNotifications(userId);
    return response.notifications || [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const markNotificationAsRead = createAsyncThunk('notification/markAsRead', async (notificationId, { rejectWithValue }) => {
  try {
    await notificationService.markAsRead(notificationId);
    return notificationId;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const markAllNotificationsAsRead = createAsyncThunk('notification/markAllAsRead', async (userId, { rejectWithValue }) => {
  try {
    await notificationService.markAllAsRead(userId);
    return true;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Async thunks for settings
export const getNotificationSettings = createAsyncThunk('notifications/getSettings', async (userId, { rejectWithValue }) => {
  try {
    const data = await notificationService.getSettings(userId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const updateNotificationSettings = createAsyncThunk('notifications/updateSettings', async ({ userId, settings }, { rejectWithValue }) => {
  try {
    const data = await notificationService.updateSettings(userId, settings);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: null,
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
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read && !notification.is_read) {
          notification.read = true;
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark All Notifications as Read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
          notification.is_read = true;
        });
        state.unreadCount = 0;
      })

      // Get Settings
      .addCase(getNotificationSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(getNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch settings';
      })

      // Update Settings
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { clearNotifications, addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
