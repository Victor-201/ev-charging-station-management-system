import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import reservationService from '../../services/reservationService';
import QRCodeDisplay from '../../components/charging/QRCodeDisplay';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function BookingConfirmationScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { reservationId, station, bookingDetails, pointId } = route.params;
  const user = useSelector((state) => state.auth.user);

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQrCode = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = user?.id || user?.user_id || user?.sub;
      if (!userId || !reservationId || !station?.id || !pointId) {
        throw new Error('Missing required data for QR code generation');
      }

      const qrData = {
        reservation_id: reservationId,
        user_id: userId,
        station_id: station.id,
        point_id: pointId,
      };

      const response = await reservationService.createQrCode(qrData);
      setQrCode(response.qr_code || response.qr_id || response.qrId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      const errorMessage = error.message || 'Không thể tạo mã QR';
      setError(errorMessage);
      Alert.alert(
        'Lỗi tạo mã QR',
        'Không thể tạo mã QR cho đặt chỗ này. Bạn vẫn có thể xem chi tiết đặt chỗ trong danh sách đặt chỗ của mình.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [reservationId, user, station, pointId]);

  useEffect(() => {
    if (reservationId) {
      fetchQrCode();
    }
  }, [reservationId, fetchQrCode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Icon name="check-circle" size={32} color={colors.success} />
        <Text style={styles.headerTitle}>Đặt chỗ thành công!</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, color: colors.onSurface }}>Đang tạo mã QR...</Text>
          </View>
        ) : (
          <>
            <QRCodeDisplay
              qrCode={qrCode}
              error={error}
              onRefresh={fetchQrCode}
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết đặt chỗ</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mã đặt chỗ:</Text>
                  <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="middle">
                    {reservationId}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trạm sạc:</Text>
                  <Text style={styles.summaryValue} numberOfLines={2} ellipsizeMode="tail">
                    {station?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Địa chỉ:</Text>
                  <Text style={styles.summaryValue} numberOfLines={2} ellipsizeMode="tail">
                    {station?.address || 'N/A'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ngày:</Text>
                  <Text style={styles.summaryValue}>{bookingDetails?.date || 'N/A'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giờ:</Text>
                  <Text style={styles.summaryValue}>{bookingDetails?.time || 'N/A'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.doneButtonText}>Về trang chủ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.secondaryContainer, marginTop: 12 }]}
              onPress={() => navigation.navigate('ReservationList')}
            >
              <Text style={[styles.doneButtonText, { color: colors.onSecondaryContainer }]}>
                Xem danh sách đặt chỗ
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
