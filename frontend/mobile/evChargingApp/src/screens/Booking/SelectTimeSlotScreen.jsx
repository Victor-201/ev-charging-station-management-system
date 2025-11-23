import { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Animated, Platform, LayoutAnimation } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import bookingService from '../../services/bookingService';
import walletService from '../../services/walletService';
import ModalHeader from '../../components/common/ModalHeader';
import AnimatedButton from '../../components/common/AnimatedButton';
import { LayoutAnimations, fadeIn } from '../../utils/animations';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  section: { backgroundColor: colors.surface, margin: 16, borderRadius: 12, padding: 16 },
  dates: { flexDirection: 'row', gap: 10 },
  date: { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.outline, minWidth: 70 },
  dateSel: { backgroundColor: colors.accent, borderColor: colors.accent },
  day: { fontSize: 12, color: colors.onSurfaceVariant },
  num: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  numSel: { color: colors.onPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.outline, minWidth: 90, alignItems: 'center' },
  slotSel: { backgroundColor: colors.accent, borderColor: colors.accent },
  slotDis: { backgroundColor: colors.brand50 },
  slotTxt: { color: colors.onSurface, fontWeight: '600' },
  slotTxtSel: { color: colors.onPrimary },
  slotTxtDis: { color: colors.onSurfaceVariant },
  btn: { backgroundColor: colors.primary, margin: 16, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: colors.onPrimary, fontWeight: '700' },
});

export default function SelectTimeSlotScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { stationId, pointId, station, point } = route.params || {};
  const user = useSelector((state) => state.auth.user);

  const [selDate, setSelDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selSlot, setSelSlot] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      out.push({ d, day: d.toLocaleDateString('vi-VN', { weekday: 'short' }), n: d.getDate() });
    }
    return out;
  }, []);

  useEffect(() => { if (days.length) setSelDate(days[0]); }, [days]);

  const loadSlots = async () => {
    if (!selDate) return;
    setLoading(true); setSlots([]);
    const dateStr = selDate.d.toISOString().split('T')[0];
    const startHour = 8, endHour = 20; // 8:00 -> 19:00
    const tmp = [];
    try {
      const checks = [];
      for (let h = startHour; h < endHour; h++) {
        const start_time = `${dateStr}T${String(h).padStart(2, '0')}:00:00Z`;
        const end_time = `${dateStr}T${String(h+1).padStart(2, '0')}:00:00Z`;
        tmp.push({ id: `${dateStr}-${h}`, time: `${String(h).padStart(2,'0')}:00`, start_time, end_time, available: true });
        checks.push(bookingService.checkAvailability({ station_id: stationId, point_id: pointId, start_time, end_time }));
      }
      const res = await Promise.allSettled(checks);
      // If backend returns error for checkAvailability, fall back to optimistic availability
      const hasAnyFulfilled = res.some(r => r.status === 'fulfilled');
      const merged = tmp.map((t, idx) => ({
        ...t,
        available: hasAnyFulfilled
          ? (res[idx].status === 'fulfilled' && res[idx].value?.available === true)
          : true,
      }));
      setSlots(merged);

      // Animate slots in (iOS only)
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimations.spring);
      }
    } catch (e) {
      console.error('loadSlots error:', e);
      // Fallback: allow user to select any slot; server will validate on create
      setSlots(tmp.map(t => ({ ...t, available: true })));
    } finally { setLoading(false); }
  };

  useEffect(() => { loadSlots(); }, [selDate, pointId]);

  // Animate content on mount (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Animated.parallel([
        fadeIn(fadeAnim, 400),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, []);

  const onConfirm = async () => {
    if (!selSlot) return;
    const userId = user?.id || user?.user_id || user?.sub;
    if (!userId) { Alert.alert('Lỗi', 'Vui lòng đăng nhập'); return; }
    setBooking(true);
    try {
      const connectorType = (point?.connector_type) || (point?.type) || 'unknown';
      const payload = {
        user_id: userId,
        station_id: stationId,
        point_id: pointId,
        connector_type: connectorType,
        start_time: selSlot.start_time,
        end_time: selSlot.end_time,
        payment_method: 'wallet', // default, backend accepts 'wallet' or 'bank_transfer'
      };
      const created = await bookingService.createReservation(payload);
      const reservationId = created?.reservation?.reservation_id || created?.reservation_id || created?.id;
      if (!reservationId) throw new Error('Không nhận được mã đặt chỗ');

      // Check wallet balance and ask to deduct if sufficient before showing QR
      try {
        const userIdNum = userId;
        const wallet = await walletService.getWallet(userIdNum);
        const balance = Number(wallet?.balance) || 0;
        const estimate = Number(
          created?.reservation?.estimated_cost ??
          created?.estimated_cost ??
          created?.reservation?.deposit_amount ??
          created?.deposit_amount ?? 0
        );
        if (estimate > 0 && balance >= estimate) {
          // Release loading before alert so user can interact
          setBooking(false);
          Alert.alert(
            'Xác nhận thanh toán',
            `Ví của bạn đủ số dư. Sẽ tạm giữ/trừ ${estimate.toLocaleString('vi-VN')} ₫ cho đặt chỗ này. Tiếp tục?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đồng ý',
                style: 'default',
                onPress: () => navigation.replace('BookingConfirmationScreen', { reservationId, station, point, slot: selSlot })
              },
            ]
          );
          return;
        }
      } catch (walletErr) {
        console.warn('Wallet check failed, continue to QR:', walletErr?.message || walletErr);
      }

      // Default flow: go to QR screen
      navigation.replace('BookingConfirmationScreen', { reservationId, station, point, slot: selSlot });
    } catch (e) {
      Alert.alert('Đặt chỗ thất bại', e?.response?.data?.error || e.message || 'Vui lòng thử lại');
    } finally { setBooking(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader
        title="Chọn ngày và giờ"
        onClose={() => navigation.goBack()}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView>
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dates}>
                {days.map((it) => (
                  <TouchableOpacity
                    key={it.d.toISOString()}
                    style={[styles.date, selDate?.d.getTime()===it.d.getTime() && styles.dateSel]}
                    onPress={()=>{
                      setSelDate(it);
                      setSelSlot(null);
                      if (Platform.OS === 'ios') {
                        LayoutAnimation.configureNext(LayoutAnimations.spring);
                      }
                    }}
                  >
                    <Text style={styles.day}>{it.day}</Text>
                    <Text style={[styles.num, selDate?.d.getTime()===it.d.getTime() && styles.numSel]}>{it.n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            {loading ? (
              <View style={{ alignItems:'center', padding: 16 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.onSurfaceVariant }}>Đang tải lịch trống...</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {slots.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.slot, !s.available && styles.slotDis, selSlot?.id===s.id && styles.slotSel]}
                    onPress={()=> {
                      if (s.available) {
                        setSelSlot(s);
                        if (Platform.OS === 'ios') {
                          LayoutAnimation.configureNext(LayoutAnimations.spring);
                        }
                      }
                    }}
                    disabled={!s.available}
                  >
                    <Text style={[styles.slotTxt, !s.available && styles.slotTxtDis, selSlot?.id===s.id && styles.slotTxtSel]}>{s.time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer safe area for critical action */}
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(12, insets.bottom + 8) }}>
          <AnimatedButton
            style={[styles.btn, { margin: 0 }, (!selSlot || booking) && { backgroundColor: colors.surfaceDisabled }]}
            onPress={onConfirm}
            disabled={!selSlot || booking}
            enableHaptic={true}
          >
            <Text style={styles.btnTxt}>{booking ? 'Đang đặt chỗ...' : 'Xác nhận đặt chỗ'}</Text>
          </AnimatedButton>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

