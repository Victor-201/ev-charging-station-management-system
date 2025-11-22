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
import reservationService from '../../services/reservationService';

export default function ReservationDetail() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

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

  const handleStartCharging = async () => {
    if (!reservation?.reservation_id) {
      console.error('❌ No reservation ID found');
      Alert.alert('Lỗi', 'Không tìm thấy mã đặt chỗ.');
      return;
    }

    setQrLoading(true);
    try {
      console.log('📱 Generating QR code for reservation:', reservation.reservation_id);
      const response = await reservationService.generateQR(reservation.reservation_id);
      console.log('✅ QR code generated successfully');

      // Validate QR response
      if (!response?.qr_code) {
        console.error('❌ No QR code in response:', response);
        throw new Error('Không nhận được mã QR từ server');
      }

      navigation.navigate('QRCodeScreen', {
        qrData: response.qr_code,
        reservationId: reservation.reservation_id,
        stationName: reservation.station?.name || `Trạm sạc #${reservation.station_id}`,
        expiresAt: response.expires_at,
      });
    } catch (err) {
      console.error('❌ Failed to generate QR code:', err);
      console.error('❌ Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });

      // Provide user-friendly error messages
      let errorMessage = 'Không thể tạo mã QR để bắt đầu sạc. Vui lòng thử lại.';

      if (err?.response?.status === 404) {
        errorMessage = 'Không tìm thấy đặt chỗ. Vui lòng kiểm tra lại.';
      } else if (err?.response?.status === 503) {
        errorMessage = 'Dịch vụ tạo mã QR tạm thời không khả dụng. Vui lòng thử lại sau.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setQrLoading(false);
    }
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

  // Format dates and times
  const startTime = new Date(reservation.start_time);
  const endTime = new Date(reservation.end_time);
  const formattedDate = startTime.toLocaleDateString('vi-VN');
  const formattedStartTime = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const formattedEndTime = endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Handle station data (may come from station object or just station_id)
  const stationName = reservation.station?.name || `Trạm sạc #${reservation.station_id}`;
  const stationAddress = reservation.station?.address || 'Đang cập nhật địa chỉ';

  // Calculate estimated cost if not provided
  const estimatedCost = reservation.estimated_cost || reservation.total_cost || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết đặt chỗ</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stationName} numberOfLines={2} ellipsizeMode="tail">{stationName}</Text>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">{stationAddress}</Text>
      </View>

      <View style={styles.section}>
        <DetailRow icon="event" label="Ngày" value={formattedDate} colors={colors} />
        <DetailRow icon="schedule" label="Thời gian" value={`${formattedStartTime} - ${formattedEndTime}`} colors={colors} />
        <DetailRow icon="power" label="Loại cổng sạc" value={reservation.connector_type || 'N/A'} colors={colors} />
      </View>

      <View style={styles.section}>
        <DetailRow icon="receipt" label="Mã đặt chỗ" value={reservation.reservation_id || reservation.id} colors={colors} />
        <DetailRow icon="attach-money" label="Chi phí ước tính" value={`${estimatedCost.toLocaleString()} VND`} colors={colors} />
        <DetailRow icon="info" label="Trạng thái" value={statusInfo.text} colors={colors} />
      </View>

      {(reservation.status === 'confirmed' || reservation.status === 'pending') && (
        <View style={styles.actionContainer}>
          {reservation.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartCharging}
              disabled={qrLoading}
            >
              {qrLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Icon name="qr-code-scanner" size={20} color={colors.onPrimary} />
                  <Text style={styles.startButtonText}>Bắt đầu sạc</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelReservation}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Icon name="cancel" size={20} color={colors.onPrimary} />
                <Text style={styles.cancelButtonText}>Hủy đặt chỗ</Text>
              </>
            )}
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
    borderBottomColor: colors.surfaceVariant,
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
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    flex: 1,
  },
  startButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
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
