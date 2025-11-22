import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationDetail({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { getNotificationById, markAsRead } = useNotifications();
  const id = route.params?.id;

  const notification = useMemo(() => getNotificationById?.(id), [getNotificationById, id]);
  const isUnread = !!notification && !(notification.read || notification.is_read);

  const handleMarkAsRead = () => {
    if (id) markAsRead(id);
  };

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('vi-VN');
    } catch {
      return ts || '';
    }
  };

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={64} color={colors.onSurfaceVariant} />
          <Text style={styles.emptyText}>Không tìm thấy thông báo</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
        {isUnread ? (
          <TouchableOpacity onPress={handleMarkAsRead} style={styles.markButton}>
            <Icon name="done" size={20} color={colors.onPrimary} />
            <Text style={styles.markButtonText}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readBadge}><Text style={styles.readBadgeText}>ĐÃ ĐỌC</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{notification.title || 'Thông báo'}</Text>
          <Text style={styles.message}>{notification.message || notification.body || ''}</Text>
          <Text style={styles.time}>{formatTime(notification.created_at || notification.timestamp)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.onSurface },
  markButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  markButtonText: { color: colors.onPrimary, fontWeight: '600' },
  readBadge: { backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  readBadgeText: { color: colors.onPrimary, fontWeight: '700' },
  content: { padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  message: { fontSize: 15, color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: 8 },
  time: { fontSize: 12, color: colors.onSurfaceVariant },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { marginTop: 12, fontSize: 16, color: colors.onSurfaceVariant },
});
