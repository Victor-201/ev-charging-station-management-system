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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import useReservations from '../../hooks/useReservations';

export default function ReservationDetail() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const {
    currentReservation: reservation,
    loading,
    error,
    fetchReservationById,
    cancelUserReservation,
  } = useReservations();

  const fetchReservation = useCallback(async () => {
    try {
      await fetchReservationById(id);
    } catch (e) {
      console.error('Failed to fetch reservation details:', e);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đặt chỗ. Vui lòng thử lại.');
    }
  }, [id, fetchReservationById]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReservation();
    } finally {
      setRefreshing(false);
    }
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
              setCancelling(true);
              await cancelUserReservation(id);
              Alert.alert('Thành công', 'Đặt chỗ của bạn đã được hủy.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.error('Failed to cancel reservation:', err);
              Alert.alert('Lỗi', 'Không thể hủy đặt chỗ. Vui lòng thử lại.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      case 'confirmed': return { text: 'Đã xác nhận', color: colors.success };
      case 'pending': return { text: 'Chờ xác nhận', color: colors.warning };
      case 'cancelled': return { text: 'Đã hủy', color: colors.error };
      case 'completed': return { text: 'Hoàn thành', color: colors.primary };
      default: return { text: status, color: colors.onSurface };
    }
  };

  const statusInfo = getStatusInfo(reservation.status);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết đặt chỗ</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stationName} numberOfLines={2} ellipsizeMode="tail">{reservation.station.name}</Text>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">{reservation.station.address}</Text>
      </View>

      <View style={styles.section}>
        <DetailRow icon="event" label="Ngày" value={new Date(reservation.date).toLocaleDateString('vi-VN')} colors={colors} />
        <DetailRow icon="schedule" label="Thời gian" value={`${reservation.start_time} - ${reservation.end_time}`} colors={colors} />
        <DetailRow icon="power" label="Loại cổng sạc" value={reservation.connector_type} colors={colors} />
      </View>

      <View style={styles.section}>
        <DetailRow icon="receipt" label="Mã đặt chỗ" value={reservation.id} colors={colors} />
        <DetailRow icon="attach-money" label="Chi phí ước tính" value={`${reservation.estimated_cost.toLocaleString()} VND`} colors={colors} />
        <DetailRow icon="info" label="Trạng thái" value={statusInfo.text} colors={colors} />
      </View>

      {reservation.status === 'confirmed' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelReservation}
          >
            <Icon name="cancel" size={20} color={colors.onPrimary} />
            <Text style={styles.cancelButtonText}>Hủy đặt chỗ</Text>
          </TouchableOpacity>
        </View>
      )}
          </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value, colors }) => {
  const styles = getStyles(colors);
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={20} color={colors.primary} style={styles.icon} />
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Should be from theme
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: 12,
    padding: 20,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: colors.onSurface,
    opacity: 0.7,
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
    color: colors.onSurface,
    opacity: 0.7,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurface,
  },
  actionContainer: {
    padding: 20,
    marginTop: 12,
    backgroundColor: colors.surface,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
