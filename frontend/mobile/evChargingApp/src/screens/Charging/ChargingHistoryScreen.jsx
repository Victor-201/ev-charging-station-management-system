import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import useCharging from '../../hooks/useCharging';
import { useSelector } from 'react-redux';

const ChargingHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);
  const { sessions, historyLoading, error, fetchHistory } = useCharging();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHistory(user.id);
    }
  }, [user?.id, fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchHistory(user.id);
    }
    setRefreshing(false);
  }, [user?.id, fetchHistory]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return theme.colors.success;
      case 'active':
      case 'charging':
        return theme.colors.primary;
      case 'paused':
        return theme.colors.warning;
      case 'failed':
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Hoàn thành';
      case 'active':
      case 'charging':
        return 'Đang sạc';
      case 'paused':
        return 'Tạm dừng';
      case 'failed':
        return 'Thất bại';
      case 'error':
        return 'Lỗi';
      default:
        return status || 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => navigation.navigate('ChargingHistoryDetail', { sessionId: item.id })}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.stationInfo}>
          <Ionicons name="location" size={20} color={theme.colors.primary} />
          <Text style={styles.stationName} numberOfLines={1}>
            {item.station_name || 'Trạm sạc'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{formatDate(item.start_time)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="flash-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>
            {item.energy_delivered ? `${item.energy_delivered.toFixed(2)} kWh` : 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>
            {item.duration ? `${Math.floor(item.duration / 60)} phút` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.sessionFooter}>
        <Text style={styles.totalCost}>{formatCurrency(item.total_cost)}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="battery-charging-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.emptyTitle}>Chưa có lịch sử sạc</Text>
      <Text style={styles.emptyText}>
        Lịch sử các phiên sạc của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (historyLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

export default ChargingHistoryScreen;

