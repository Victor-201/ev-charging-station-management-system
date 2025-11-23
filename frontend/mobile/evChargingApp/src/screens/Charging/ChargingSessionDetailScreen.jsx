import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import chargingService from '../../services/chargingService';
import { useFocusEffect } from '@react-navigation/native';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, margin: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 15, color: colors.onSurfaceVariant },
  value: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  status: { textTransform: 'capitalize', fontWeight: 'bold' },
  stopBtn: { backgroundColor: colors.error, paddingVertical: 14, borderRadius: 8, alignItems: 'center', margin: 16 },
  stopBtnTxt: { color: colors.onError, fontSize: 16, fontWeight: '700' },
});

export default function ChargingSessionDetailScreen({ route, navigation }) {
  const { sessionId } = route.params || {};
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const pollInterval = useRef(null);

  const [session, setSession] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  const isSessionActive = session?.status === 'running' || session?.status === 'paused';

  const fetchSession = useCallback(async () => {
    try {
      const data = await chargingService.getSession(sessionId);
      setSession(data);
    } catch (e) {
      console.error('fetchSession error:', e);
      Alert.alert('Lỗi', 'Không thể tải thông tin phiên sạc.');
      navigation.goBack();
    }
  }, [sessionId]);

  const fetchTelemetry = useCallback(async () => {
    if (!isSessionActive) return;
    try {
      const data = await chargingService.getTelemetry(sessionId);
      setTelemetry(data);
    } catch (e) {
      console.warn('fetchTelemetry error:', e.message);
    }
  }, [sessionId, isSessionActive]);

  useFocusEffect(
    useCallback(() => {
      fetchSession().finally(() => setLoading(false));
      pollInterval.current = setInterval(fetchTelemetry, 5000); // Poll every 5s

      const onBeforeRemove = (e) => {
        if (!isSessionActive) return;
        e.preventDefault();
        Alert.alert(
          'Dừng phiên sạc?',
          'Bạn có chắc muốn rời khỏi màn hình này? Phiên sạc sẽ tiếp tục chạy nền.',
          [
            { text: 'Ở lại', style: 'cancel', onPress: () => {} },
            { text: 'Rời đi', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
          ]
        );
      };
      navigation.addListener('beforeRemove', onBeforeRemove);

      return () => {
        clearInterval(pollInterval.current);
        navigation.removeListener('beforeRemove', onBeforeRemove);
      };
    }, [fetchSession, fetchTelemetry, isSessionActive])
  );

  const onStop = async () => {
    Alert.alert('Xác nhận dừng', 'Bạn có chắc muốn dừng phiên sạc này không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Dừng ngay', style: 'destructive', onPress: async () => {
        try {
          setStopping(true);
          await chargingService.stop(sessionId);
          Alert.alert('Thành công', 'Phiên sạc đã kết thúc.');
          // Navigate to invoice or history detail
          navigation.replace('ChargingHistoryDetail', { sessionId });
        } catch (e) {
          Alert.alert('Lỗi', e.response?.data?.error || 'Không thể dừng phiên sạc.');
        } finally { setStopping(false); }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!session) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 32, color: colors.onSurfaceVariant }}>Không tìm thấy phiên sạc.</Text></View>;

  const duration = telemetry?.elapsed_time_seconds ? (telemetry.elapsed_time_seconds / 60).toFixed(1) : '0';
  const energy = telemetry?.kwh_consumed ? telemetry.kwh_consumed.toFixed(2) : '0.00';
  const power = telemetry?.current_power_kw ? telemetry.current_power_kw.toFixed(2) : '0.00';
  const cost = session?.estimated_cost ? session.estimated_cost.toLocaleString('vi-VN') : '0';

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.title}>Chi tiết phiên sạc</Text>
          <View style={styles.row}><Text style={styles.label}>Trạng thái</Text><Text style={[styles.value, styles.status, { color: isSessionActive ? colors.success : colors.error }]}>{session.status}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Thời gian</Text><Text style={styles.value}>{duration} phút</Text></View>
          <View style={styles.row}><Text style={styles.label}>Năng lượng đã sạc</Text><Text style={styles.value}>{energy} kWh</Text></View>
          <View style={styles.row}><Text style={styles.label}>Công suất hiện tại</Text><Text style={styles.value}>{power} kW</Text></View>
          <View style={styles.row}><Text style={styles.label}>Chi phí tạm tính</Text><Text style={styles.value}>{cost} đ</Text></View>
        </View>
      </ScrollView>
      {isSessionActive && (
        <TouchableOpacity style={[styles.stopBtn, { marginBottom: Math.max(16, insets.bottom + 8) }]} onPress={onStop} disabled={stopping}>
          {stopping ? <ActivityIndicator color={colors.onError} /> : <Text style={styles.stopBtnTxt}>Dừng sạc</Text>}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

