import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import reservationService from '../../services/reservationService';
import { theme } from '../../config/theme';

export default function ReservationDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationService.getById(id);
      const data = response?.data || response;
      setReservation(data);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch reservation details:', e);
      setError('Không thể tải chi tiết đặt chỗ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservation().then(() => setRefreshing(false));
  }, [fetchReservation]);

  const handleCancelReservation = () => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy đặt chỗ này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt chỗ',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancel(id);
              Alert.alert('Thành công', 'Đặt chỗ của bạn đã được hủy.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('Failed to cancel reservation:', err);
              Alert.alert('Lỗi', 'Không thể hủy đặt chỗ. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!reservation) {
    return null;
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed': return { text: 'Đã xác nhận', color: theme.colors.success };
      case 'pending': return { text: 'Chờ xác nhận', color: theme.colors.warning };
      case 'cancelled': return { text: 'Đã hủy', color: theme.colors.error };
      case 'completed': return { text: 'Hoàn thành', color: theme.colors.primary };
      default: return { text: status, color: theme.colors.onSurfaceVariant };
    }
  };

  const statusInfo = getStatusInfo(reservation.status);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết đặt chỗ</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stationName}>{reservation.station.name}</Text>
        <Text style={styles.address}>{reservation.station.address}</Text>
      </View>

      <View style={styles.section}>
        <DetailRow icon="event" label="Ngày" value={new Date(reservation.date).toLocaleDateString('vi-VN')} />
        <DetailRow icon="schedule" label="Thời gian" value={`${reservation.start_time} - ${reservation.end_time}`} />
        <DetailRow icon="power" label="Loại cổng sạc" value={reservation.connector_type} />
      </View>

      <View style={styles.section}>
        <DetailRow icon="receipt" label="Mã đặt chỗ" value={reservation.id} />
        <DetailRow icon="attach-money" label="Chi phí ước tính" value={`${reservation.estimated_cost.toLocaleString()} VND`} />
        <DetailRow icon="info" label="Trạng thái" value={statusInfo.text} />
      </View>

      {reservation.status === 'confirmed' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelReservation}
          >
            <Icon name="cancel" size={20} color="white" />
            <Text style={styles.cancelButtonText}>Hủy đặt chỗ</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={20} color={theme.colors.primary} style={styles.icon} />
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  statusBadge: {
    align-self: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  actionContainer: {
    padding: 20,
    marginTop: 12,
    backgroundColor: 'white',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
