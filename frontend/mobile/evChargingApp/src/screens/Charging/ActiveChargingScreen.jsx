import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../hooks/useSocket';
import { updateTelemetry } from '../../store/slices/chargingSlice';
import { useTheme } from 'react-native-paper';
import useCharging from '../../hooks/useCharging';
import ChargingProgress from './ChargingProgress';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for fixed controls
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
  },
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: colors.onSurface,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.onSurface,
    marginBottom: 4,
  },
  connectorInfo: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.onSurface + '80',
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: colors.onSurface + '80',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    color: colors.onSurface,
  },
  divider: {
    marginVertical: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.onSurface + '20',
  },
  controlButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  stopButton: {
    paddingVertical: 8,
  },
});

const ActiveChargingScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { sessionId } = route.params;
  const { activeSession, loading, error } = useSelector((state) => state.charging);
  const { getTelemetry, pause, resume, stop } = useCharging();
  const [actionLoading, setActionLoading] = useState(null); // 'pause', 'resume', 'stop'

  // WebSocket event handlers
  const eventHandlers = useCallback({
    charging_update: (data) => {
      dispatch(updateTelemetry({ sessionId, telemetry: data }));
    },
    session_terminated: (data) => {
      Alert.alert('Phiên sạc đã kết thúc', data.message || 'Phiên sạc của bạn đã hoàn tất.', [
        { text: 'OK', onPress: () => navigation.navigate('ChargingComplete', { sessionId }) },
      ]);
    },
    error: (err) => {
      console.error('Socket error:', err);
    }
  }, [dispatch, navigation, sessionId]);

  useSocket(eventHandlers);

  // Header action to open realtime detail screen
  useEffect(() => {
    if (!sessionId) return;
    navigation.setOptions({
      headerRight: () => (
        <Button compact mode="text" onPress={() => navigation.navigate('ChargingSessionDetail', { sessionId })}>
          Realtime
        </Button>
      ),
    });
  }, [navigation, sessionId]);


  // Polling fallback for telemetry updates (every 5 seconds)
  useEffect(() => {
    if (!sessionId) return;

    const pollTelemetry = async () => {
      try {
        await getTelemetry(sessionId);
      } catch (error) {
        console.error('Telemetry polling error:', error);
      }
    };

    // Initial fetch
    pollTelemetry();

    // Set up polling interval
    const interval = setInterval(pollTelemetry, 5000);

    return () => clearInterval(interval);
  }, [sessionId, getTelemetry]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      let result;
      switch (action) {
        case 'pause':
          result = await pause(sessionId);
          if (result.error) {
            throw new Error(result.error.message || 'Không thể tạm dừng');
          }
          Alert.alert('Thành công', 'Đã tạm dừng phiên sạc');
          break;
        case 'resume':
          result = await resume(sessionId);
          if (result.error) {
            throw new Error(result.error.message || 'Không thể tiếp tục');
          }
          Alert.alert('Thành công', 'Đã tiếp tục phiên sạc');
          break;
        case 'stop':
          result = await stop(sessionId);
          if (result.error) {
            throw new Error(result.error.message || 'Không thể dừng');
          }
          // Navigate to complete screen
          navigation.replace('ChargingComplete', { sessionId });
          break;
        default:
          break;
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || `Không thể thực hiện hành động`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !activeSession) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!activeSession) {
    return <View style={styles.centered}><Text>Không tìm thấy thông tin phiên sạc.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Station Info Header */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Đang sạc...</Text>
            <Text style={styles.stationName}>{activeSession.station_name || 'Trạm sạc'}</Text>
            <Text style={styles.connectorInfo}>
              Cổng sạc: {activeSession.connector_id || activeSession.point_id || 'N/A'}
            </Text>
          </Card.Content>
        </Card>

        {/* Charging Progress Component */}
        <ChargingProgress
          currentEnergy={activeSession.energy_consumed || 0}
          targetEnergy={activeSession.target_energy || 50}
          chargingRate={activeSession.charging_rate || activeSession.power_kw || 0}
          estimatedTime={activeSession.estimated_time || 0}
          batteryLevel={activeSession.battery_level || activeSession.soc || 0}
          status={activeSession.status || 'CHARGING'}
        />

        {/* Session Stats */}
        <Card style={styles.card}>
          <Card.Content style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Năng lượng tiêu thụ</Text>
              <Text style={styles.statValue}>{activeSession.energy_consumed?.toFixed(2) || 0} kWh</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Thời gian sạc</Text>
              <Text style={styles.statValue}>
                {activeSession.duration ?
                  new Date(activeSession.duration * 1000).toISOString().substring(11, 19) :
                  '00:00:00'
                }
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Chi phí hiện tại</Text>
              <Text style={styles.statValue}>{activeSession.cost?.toLocaleString('vi-VN') || 0} ₫</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {activeSession.status === 'CHARGING' ? (
          <Button
            mode="contained"
            onPress={() => handleAction('pause')}
            loading={actionLoading === 'pause'}
            disabled={actionLoading}
            style={styles.controlButton}
            buttonColor={colors.warning}
            icon="pause-circle"
          >
            Tạm dừng
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => handleAction('resume')}
            loading={actionLoading === 'resume'}
            disabled={actionLoading}
            style={styles.controlButton}
            buttonColor={colors.success}
            icon="play-circle"
          >
            Tiếp tục
          </Button>
        )}
        <Button
          mode="contained"
          buttonColor={colors.error}
          onPress={() => handleAction('stop')}
          loading={actionLoading === 'stop'}
          disabled={actionLoading}
          style={styles.stopButton}
          icon="stop-circle"
        >
          Dừng sạc
        </Button>
      </View>
    </SafeAreaView>
  );
};



export default ActiveChargingScreen;

