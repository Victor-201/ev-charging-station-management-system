import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

export default function NotificationList() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data - sẽ được thay thế bằng API call
  const sampleNotifications = [
    {
      id: '1',
      title: 'Đặt chỗ thành công',
      message: 'Bạn đã đặt chỗ thành công tại Trạm sạc Central Park vào lúc 14:00 ngày 05/11/2024',
      type: 'booking',
      read: false,
      created_at: '2024-11-04T10:30:00Z'
    },
    {
      id: '2',
      title: 'Thanh toán hoàn tất',
      message: 'Giao dịch 50.000 VND đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ!',
      type: 'payment',
      read: false,
      created_at: '2024-11-04T14:45:00Z'
    },
    {
      id: '3',
      title: 'Khuyến mãi mới',
      message: 'Giảm 20% cho lần sạc tiếp theo! Áp dụng từ ngày 06-10/11/2024.',
      type: 'promotion',
      read: true,
      created_at: '2024-11-03T09:00:00Z'
    },
    {
      id: '4',
      title: 'Bảo trì hệ thống',
      message: 'Hệ thống sẽ bảo trì từ 02:00-04:00 ngày 06/11/2024. Vui lòng hoàn tất giao dịch trước thời gian này.',
      type: 'system',
      read: true,
      created_at: '2024-11-02T18:00:00Z'
    },
    {
      id: '5',
      title: 'Sạc điện hoàn tất',
      message: 'Xe của bạn đã sạc đầy. Vui lòng di chuyển xe để nhường chỗ cho khách hàng khác.',
      type: 'charging',
      read: true,
      created_at: '2024-11-01T15:30:00Z'
    }
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // TODO: Call notification API
      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      // TODO: Call mark as read API
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Call mark all as read API
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking': return 'event';
      case 'payment': return 'payment';
      case 'promotion': return 'local-offer';
      case 'system': return 'info';
      case 'charging': return 'battery-charging-full';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking': return colors.success;
      case 'payment': return colors.primary;
      case 'promotion': return colors.warning;
      case 'system': return colors.secondary;
      case 'charging': return colors.accent;
      default: return colors.onSurfaceVariant;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}
      onPress={() => {
        if (!item.read) {
          markAsRead(item.id);
        }
        navigation.navigate('NotificationDetail', { id: item.id });
      }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Icon 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.notificationTitle,
                !item.read && styles.unreadTitle
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2} ellipsizeMode="tail">
            {item.message}
          </Text>
          <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} thông báo chưa đọc
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Đánh dấu tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="notifications-none" size={64} color={colors.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
          <Text style={styles.emptySubtitle}>
            Các thông báo mới sẽ hiển thị ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  unreadCount: {
    fontSize: 12,
    color: colors.onPrimary + 'CC', // 80% opacity
    marginTop: 2,
  },
  markAllButton: {
    backgroundColor: colors.onPrimary + '33', // 20% opacity
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.onSurface + '99', // 60% opacity
    lineHeight: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurface + '99', // 60% opacity
    textAlign: 'center',
    lineHeight: 20,
  },
});
