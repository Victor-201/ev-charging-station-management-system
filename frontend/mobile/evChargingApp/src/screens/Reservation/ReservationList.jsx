import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetworkErrorView from '../../components/common/NetworkErrorView';
import { useTheme } from 'react-native-paper';
import useReservations from '../../hooks/useReservations';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  addButton: {
    backgroundColor: colors.onPrimary + '33',
    borderRadius: 20,
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  reservationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.onPrimary,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
    marginBottom: 12,
  },
  reservationDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
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
    color: colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ReservationList() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    reservations,
    loading,
    error,
    fetchUserReservations,
  } = useReservations();

  useFocusEffect(
    React.useCallback(() => {
      loadReservations();
    }, [])
  );

  const loadReservations = async () => {
    try {
      await fetchUserReservations();
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đặt chỗ. Vui lòng thử lại.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserReservations();
    } catch (error) {
      console.error('Error refreshing reservations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.accent;
      default: return colors.onSurface;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const renderReservationItem = ({ item }) => {
    // Format date and time from ISO string
    const startTime = new Date(item.start_time);
    const formattedDate = startTime.toLocaleDateString('vi-VN');
    const formattedTime = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.reservationCard}
        onPress={() => navigation.navigate('ReservationDetail', {
          id: item.reservation_id || item.id
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.stationName}>
            {item.station_name || `Trạm sạc #${item.station_id}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.address && <Text style={styles.address}>{item.address}</Text>}

        <View style={styles.reservationDetails}>
          <View style={styles.detailRow}>
            <Icon name="event" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
            <Text style={styles.detailText}>{formattedDate} • {formattedTime}</Text>
          </View>
          {item.connector_type && (
            <View style={styles.detailRow}>
              <Icon name="power" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
              <Text style={styles.detailText}>Cổng {item.connector_type}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state on initial load
  if (loading && !refreshing && reservations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Danh sách đặt chỗ</Text>
        </View>
        <View style={[styles.emptyState, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Danh sách đặt chỗ</Text>
        </View>
        <View style={[styles.emptyState, { justifyContent: 'center' }]}>
          <NetworkErrorView title="Không thể tải danh sách đặt chỗ" message={error} onRetry={onRefresh} />
        </View>
      </SafeAreaView>
    );
  }

  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách đặt chỗ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Icon name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-note" size={64} color={colors.onSurface} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Chưa có đặt chỗ nào</Text>
          <Text style={styles.emptySubtitle}>
            Hãy tìm trạm sạc và đặt chỗ cho lần sạc tiếp theo
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.primaryButtonText}>Tìm trạm sạc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item.id?.toString() || item.reservation_id?.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}


