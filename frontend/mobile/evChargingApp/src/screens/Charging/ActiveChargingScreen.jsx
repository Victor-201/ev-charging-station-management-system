import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { updateTelemetry } from '../../store/slices/chargingSlice';
import useCharging from '../../hooks/useCharging';
import useRealTimeUpdates from '../../hooks/useRealTimeUpdates';
import ChargingProgressCircle from '../../components/charging/ChargingProgressCircle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, marginBottom: 16 },
  // Content
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  stationName: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginTop: 24, textAlign: 'center' },
  connectorInfo: { fontSize: 16, color: colors.onSurfaceVariant, textAlign: 'center' },
  // Stats Row
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 24 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.onSurface },
  statLabel: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  // Controls
  controlsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.surface },
  stopButton: { paddingVertical: 8, borderRadius: 30 },
});

const ActiveChargingScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { sessionId } = route.params;
  const { activeSession, loading, error } = useSelector((state) => state.charging);
  const { getTelemetry, stop } = useCharging();
  const [actionLoading, setActionLoading] = useState(false);

  // Memoize event handlers to prevent unnecessary re-renders
  const socketEventHandlers = useMemo(() => ({
    'charging_update': (data) => {
      if (data?.sessionId === sessionId) {
        dispatch(updateTelemetry({ telemetry: data }));
      }
    },
    'telemetry_update': (data) => {
      if (data?.sessionId === sessionId) {
        dispatch(updateTelemetry({ telemetry: data }));
      }
    },
    'session_status_change': (data) => {
      if (data?.sessionId === sessionId) {
        dispatch(updateTelemetry({ telemetry: data }));
      }
    },
  }), [sessionId, dispatch]);

  // Use real-time updates via WebSocket (replaces polling)
  useRealTimeUpdates(socketEventHandlers, !!sessionId);

  // Initial telemetry fetch only (no polling)
  useEffect(() => {
    if (!sessionId) return;
    getTelemetry(sessionId); // Fetch once, then rely on socket updates
  }, [sessionId, getTelemetry]);

  const handleStopCharging = async () => {
    setActionLoading(true);
    try {
      const result = await stop(sessionId);
      if (result.error) throw new Error(result.error.message || 'Không thể dừng phiên sạc');

      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Main' },
            { name: 'ChargingComplete', params: { sessionId } },
          ],
        })
      );
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !activeSession) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error || !activeSession) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy phiên sạc.'}</Text>
        <Button onPress={() => navigation.goBack()}>Quay lại</Button>
      </View>
    );
  }

  const progress = (activeSession.energy_consumed || 0) / (activeSession.target_energy || 50);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ChargingProgressCircle
          progress={progress}
          soc={activeSession.soc || 0}
          power={activeSession.power_kw || 0}
        />
        <Text style={styles.stationName}>{activeSession.station_name || 'Trạm sạc'}</Text>
        <Text style={styles.connectorInfo}>Cổng sạc: {activeSession.connector_id || 'N/A'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Icon name="timer-outline" size={24} color={colors.onSurfaceVariant} />
            <Text style={styles.statValue}>{new Date((activeSession.duration || 0) * 1000).toISOString().substr(11, 8)}</Text>
            <Text style={styles.statLabel}>Thời gian</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="cash" size={24} color={colors.onSurfaceVariant} />
            <Text style={styles.statValue}>{(activeSession.cost || 0).toLocaleString('vi-VN')} ₫</Text>
            <Text style={styles.statLabel}>Chi phí</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <Button
          mode="contained"
          buttonColor={colors.error}
          onPress={handleStopCharging}
          loading={actionLoading}
          disabled={actionLoading}
          style={styles.stopButton}
          icon="stop-circle"
          contentStyle={{ paddingVertical: 8 }}
        >
          Dừng sạc
        </Button>
      </View>
    </SafeAreaView>
  );
};



export default ActiveChargingScreen;

