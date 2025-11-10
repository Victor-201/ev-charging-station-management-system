import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../hooks/useSocket';
import { updateTelemetry } from '../../store/slices/chargingSlice';
import chargingService from '../../services/chargingService';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
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
    marginTop: 'auto',
    paddingBottom: 16,
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
  const [actionLoading, setActionLoading] = useState(null); // 'pause', 'resume', 'stop'

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

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'pause':
          await chargingService.pause(sessionId);
          break;
        case 'resume':
          await chargingService.resume(sessionId);
          break;
        case 'stop':
          await chargingService.stop(sessionId);
          break;
        default:
          break;
      }
    } catch (err) {
      Alert.alert('Lỗi', `Không thể thực hiện hành động: ${err.message}`);
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
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Đang sạc...</Text>
          <Text>{activeSession.station_name}</Text>
          <Text>Cổng sạc: {activeSession.connector_id}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Năng lượng</Text>
            <Text style={styles.statValue}>{activeSession.energy_consumed?.toFixed(2) || 0} kWh</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Thời gian</Text>
            <Text style={styles.statValue}>{new Date(activeSession.duration * 1000).toISOString().substr(11, 8)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Chi phí</Text>
            <Text style={styles.statValue}>{activeSession.cost?.toLocaleString('vi-VN') || 0} ₫</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.controlsContainer}>
        {activeSession.status === 'CHARGING' ? (
          <Button 
            mode="contained" 
            onPress={() => handleAction('pause')}
            loading={actionLoading === 'pause'}
            disabled={actionLoading}
            style={styles.controlButton}
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
            icon="play-circle"
          >
            Tiếp tục
          </Button>
        )}
        <Button 
          mode="contained" 
          color={colors.error}
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

