import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import mockService from '../../services/mockService';

const NotificationListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Mock notifications data
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'charging_complete',
          title: 'Sạc hoàn tất',
          message: 'Phiên sạc tại Trạm sạc Central Park đã hoàn tất. Tổng: 45.2 kWh',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          read: false,
          icon: 'battery-charging-full',
          iconColor: colors.success,
        },
        {
          id: 'notif-2',
          type: 'reservation_confirmed',
          title: 'Đặt chỗ đã xác nhận',
          message: 'Đặt chỗ của bạn tại Trạm sạc Landmark 81 vào 14:00 ngày 10/11 đã được xác nhận',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false,
          icon: 'event-available',
          iconColor: colors.primary,
        },
        {
          id: 'notif-3',
          type: 'payment_success',
          title: 'Thanh toán thành công',
          message: 'Bạn đã nạp 500,000đ vào ví thành công',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          read: true,
          icon: 'payment',
          iconColor: colors.success,
        },
        {
          id: 'notif-4',
          type: 'promotion',
          title: 'Khuyến mãi đặc biệt',
          message: 'Giảm 20% cho lần sạc tiếp theo tại tất cả các trạm. Áp dụng đến 15/11',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: true,
          icon: 'local-offer',
          iconColor: colors.warning,
        },
        {
          id: 'notif-5',
          type: 'system',
          title: 'Cập nhật hệ thống',
          message: 'Ứng dụng đã được cập nhật lên phiên bản 2.1.0 với nhiều tính năng mới',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          read: true,
          icon: 'system-update',
          iconColor: colors.primary,
        },
        {
          id: 'notif-6',
          type: 'reminder',
          title: 'Nhắc nhở đặt chỗ',
          message: 'Bạn có lịch đặt chỗ sạc vào 09:00 ngày mai tại Trạm sạc Central Park',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
          read: true,
          icon: 'notifications-active',
          iconColor: colors.warning,
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'read':
        return notifications.filter((n) => n.read);
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
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Icon name={item.icon} size={28} color={item.iconColor} />
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

        <Text style={styles.notificationTime}>{getTimeAgo(item.timestamp)}</Text>
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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
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
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
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
        keyExtractor={(item) => item.id}
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
      color: '#fff',
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

