import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import bookingService from '../../services/bookingService';
import QRCodeDisplay from '../../components/booking/QRCodeDisplay';
import reminderService from '../../services/reminderService';
import useSocket from '../../hooks/useSocket';

import { useInAppNotification } from '../../components/notification/InAppNotification';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline },
  title: { fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: 8 },
  section: { backgroundColor: colors.surface, borderRadius: 12, margin: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: colors.onSurfaceVariant },
  value: { color: colors.onSurface, fontWeight: '600', flex: 1, textAlign: 'right' },
  actions: { padding: 16, gap: 12 },
  btn: { alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
});

export default function BookingConfirmationScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { reservationId, station, point, slot } = route.params || {};

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notifier = useInAppNotification();

  const fetchQr = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!reservationId) throw new Error('Thiếu mã đặt chỗ');
      const res = await bookingService.generateQRCode({ reservation_id: reservationId, expires_in: 600 });
      setQrCode(res?.qr_code || res?.qr_id || res?.qrId || null);
      if (!res?.qr_code && !res?.qr_id && !res?.qrId) throw new Error('Không nhận được mã QR');
    } catch (e) {
      console.error('generateQRCode error:', e);
      setError(e?.response?.data?.error || e.message || 'Không thể tạo mã QR');
      Alert.alert('Lỗi tạo QR', 'Bạn vẫn có thể xem đặt chỗ trong mục của tôi.');
    } finally { setLoading(false); }
  }, [reservationId]);

  useEffect(() => { fetchQr(); }, [fetchQr]);

  // Show success banner and provide quick context
  useEffect(() => {
    if (reservationId) {
      try {
        notifier.show({
          type: 'success',
          icon: 'event-available',
          title: 'Đặt chỗ thành công',
          message: `${station?.name || 'Trạm sạc'} • ${slot?.time || ''}`,
        });
      } catch {}
    }
  }, [reservationId]);



  const onAddReminder = async () => {
    try {
      if (Platform.OS !== 'ios') return;
      const start = slot?.start_time || slot?.startTime;
      if (!start) { Alert.alert('Thiếu thời gian', 'Không có thời gian bắt đầu của đặt chỗ'); return; }
      const res = await reminderService.createBookingReminder({ stationName: station?.name || 'Trạm sạc', startTime: start });
      if (res.ok) {
        notifier.show({ type: 'success', icon: 'notifications-active', title: 'Đã thêm lời nhắc', message: 'Nhắc trước 15 phút trong Lời nhắc' });
      } else if (res.needSettings) {
        Alert.alert(
          'Quyền bị từ chối',
          'Hãy cấp quyền truy cập Lời nhắc trong Cài đặt để tạo nhắc trước giờ bắt đầu 15 phút.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => reminderService.openSettings() }
          ]
        );
      } else {
        Alert.alert('Không thể tạo lời nhắc', res.error || 'Vui lòng thử lại');
      }
    } catch (e) {
      Alert.alert('Không thể tạo lời nhắc', e?.message || 'Vui lòng thử lại');
    }
  };

  // Socket event handlers for reservation updates
  const reservationSocketHandlers = {
    'reservation:update': (data) => {
      // Only process updates for our reservation
      if (data.reservationId === reservationId) {
        console.log('Received reservation update via socket:', data);

        const sessionId = data.session_id || data.sessionId;
        const status = (data.status || '').toLowerCase();

        if (sessionId || status === 'started' || status === 'checked_in') {
          navigation.replace('ChargingSessionDetail', { sessionId });
        }
      }
    },
    'charging:started': (data) => {
      // Handle charging started event
      if (data.reservationId === reservationId && data.sessionId) {
        console.log('Charging started for reservation:', reservationId);
        navigation.replace('ChargingSessionDetail', { sessionId: data.sessionId });
      }
    }
  };

  // Initialize socket connection
  useSocket(reservationSocketHandlers);

  // Check reservation status once initially (no polling)
  useEffect(() => {
    if (!reservationId) return;

    const checkInitialStatus = async () => {
      try {
        const res = await bookingService.getById(reservationId);
        const sessionId = res?.session_id || res?.reservation?.session_id;
        const status = (res?.status || res?.reservation?.status || '').toLowerCase();
        if (sessionId || status === 'started' || status === 'checked_in') {
          navigation.replace('ChargingSessionDetail', { sessionId: sessionId || res?.reservation?.session_id });
        }
      } catch (e) {
        // silent; QR flow vẫn hoạt động bình thường
      }
    };

    checkInitialStatus();
  }, [reservationId, navigation]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon name="check-circle" size={36} color={colors.success} />
        <Text style={styles.title}>Đặt chỗ thành công</Text>
      </View>

      {loading ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.onSurfaceVariant }}>Đang tạo mã QR...</Text>
        </View>
      ) : (
        <>
          <QRCodeDisplay qrCode={qrCode} error={error} onRefresh={fetchQr} />

          <View style={styles.section}>
            <View style={styles.row}><Text style={styles.label}>Mã đặt chỗ</Text><Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">{reservationId}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Trạm</Text><Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">{station?.name || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Địa chỉ</Text><Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">{station?.address || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Điểm sạc</Text><Text style={styles.value}>{point?.name || point?.point_code || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Thời gian</Text><Text style={styles.value}>{slot?.time || 'N/A'}</Text></View>
          </View>

          <View style={[styles.actions, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.success }]}
                onPress={onAddReminder}
                accessibilityRole="button"
                accessibilityLabel="Thêm lời nhắc"
              >
                <Text style={{ color: colors.onSuccess, fontWeight: '700' }}>Thêm lời nhắc</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={()=>navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Về trang chủ"
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Về trang chủ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.secondaryContainer }]}
              onPress={()=>navigation.navigate('MyBookingsScreen')}
              accessibilityRole="button"
              accessibilityLabel="Xem đặt chỗ của tôi"
            >
              <Text style={{ color: colors.onSecondaryContainer, fontWeight: '700' }}>Xem đặt chỗ của tôi</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

