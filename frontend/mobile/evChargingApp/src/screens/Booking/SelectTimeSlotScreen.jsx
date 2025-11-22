import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import bookingService from '../../services/bookingService';

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
  const { stationId, pointId, station, point } = route.params || {};
  const user = useSelector((state) => state.auth.user);

  const [selDate, setSelDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selSlot, setSelSlot] = useState(null);

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
    try {
      const dateStr = selDate.d.toISOString().split('T')[0];
      const startHour = 8, endHour = 20; // 8:00 -> 19:00
      const tmp = [];
      const checks = [];
      for (let h = startHour; h < endHour; h++) {
        const start_time = `${dateStr}T${String(h).padStart(2, '0')}:00:00Z`;
        const end_time = `${dateStr}T${String(h+1).padStart(2, '0')}:00:00Z`;
        tmp.push({ id: `${dateStr}-${h}`, time: `${String(h).padStart(2,'0')}:00`, start_time, end_time, available: false });
        checks.push(bookingService.checkAvailability({ station_id: stationId, point_id: pointId, start_time, end_time }));
      }
      const res = await Promise.allSettled(checks);
      const merged = tmp.map((t, idx) => ({ ...t, available: res[idx].status === 'fulfilled' && res[idx].value?.available === true }));
      setSlots(merged);
    } catch (e) {
      console.error('loadSlots error:', e);
      Alert.alert('Lỗi', 'Không thể tải lịch trống');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadSlots(); }, [selDate, pointId]);

  const onConfirm = async () => {
    if (!selSlot) return;
    const userId = user?.id || user?.user_id || user?.sub;
    if (!userId) { Alert.alert('Lỗi', 'Vui lòng đăng nhập'); return; }
    setBooking(true);
    try {
      const payload = { user_id: userId, station_id: stationId, point_id: pointId, start_time: selSlot.start_time, end_time: selSlot.end_time };
      const created = await bookingService.createReservation(payload);
      const reservationId = created?.reservation_id || created?.id;
      if (!reservationId) throw new Error('Không nhận được mã đặt chỗ');
      navigation.replace('BookingConfirmationScreen', { reservationId, station, point, slot: selSlot });
    } catch (e) {
      Alert.alert('Đặt chỗ thất bại', e?.response?.data?.error || e.message || 'Vui lòng thử lại');
    } finally { setBooking(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Chọn ngày và giờ</Text></View>
      <ScrollView>
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dates}>
              {days.map((it) => (
                <TouchableOpacity key={it.d.toISOString()} style={[styles.date, selDate?.d.getTime()===it.d.getTime() && styles.dateSel]} onPress={()=>{setSelDate(it); setSelSlot(null);}}>
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
                <TouchableOpacity key={s.id} style={[styles.slot, !s.available && styles.slotDis, selSlot?.id===s.id && styles.slotSel]} onPress={()=> s.available && setSelSlot(s)} disabled={!s.available}>
                  <Text style={[styles.slotTxt, !s.available && styles.slotTxtDis, selSlot?.id===s.id && styles.slotTxtSel]}>{s.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.btn, (!selSlot||booking) && { backgroundColor: colors.surfaceDisabled }]} onPress={onConfirm} disabled={!selSlot || booking}>
        <Text style={styles.btnTxt}>{booking ? 'Đang đặt chỗ...' : 'Xác nhận đặt chỗ'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

