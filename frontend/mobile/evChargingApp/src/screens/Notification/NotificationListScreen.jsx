import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetworkErrorView from '../../components/common/NetworkErrorView';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../store/slices/notificationSlice';

const NotificationListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, loading, error } = useSelector((state) => state.notification);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const loadNotifications = React.useCallback(() => {
    const uid = user?.id || user?.user_id || user?.sub;
    if (uid) {
      return dispatch(getNotifications(uid)).unwrap?.();
    }
    return Promise.resolve();
  }, [dispatch, user?.id, user?.user_id, user?.sub]);

  // Fix: Wrap loadNotifications in useCallback to prevent continuous calls
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      dispatch(markAllNotificationsAsRead(user.id));
    }
  };

  const deleteNotification = (notificationId) => {
    // Delete API chưa được hỗ trợ ở backend → hiển thị thông báo thân thiện
    console.log('Delete notification (not implemented):', notificationId);
    alert('Chức năng xóa thông báo đang được phát triển.');
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !(n.read || n.is_read));
      case 'read':
        return notifications.filter((n) => (n.read || n.is_read));
      default:
        return notifications;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const renderFilterButton = (label, value) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
      onPress={() => {
        handleMarkAsRead(item.id);
        navigation.navigate('NotificationDetail', { id: item.id });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Icon name={item.icon || 'notifications'} size={28} color={item.iconColor || colors.primary} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.notificationTitleUnread]}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadBadge} />}
        </View>

        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <Text style={styles.notificationTime}>{getTimeAgo(item.created_at || item.timestamp)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filteredNotifications = getFilteredNotifications();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <NetworkErrorView title="Không thể tải thông báo" message={error} onRetry={onRefresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Icon name="done-all" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterButton('Tất cả', 'all')}
        {renderFilterButton(`Chưa đọc (${unreadCount})`, 'unread')}
        {renderFilterButton('Đã đọc', 'read')}
      </View>

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={64} color={colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>Không có thông báo</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo nào'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    backButton: {
      padding: 8,
    },
    headerTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerBadge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    headerBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.onPrimary,
    },
    markAllButton: {
      padding: 8,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: colors.onPrimary,
      fontWeight: '600',
    },
    listContainer: {
      padding: 16,
    },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    notificationCardUnread: {
      backgroundColor: colors.primaryContainer,
      elevation: 2,
    },
    notificationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
    },
    notificationTitleUnread: {
      fontWeight: 'bold',
    },
    unreadBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 6,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 8,
    },
  });

export default NotificationListScreen;

