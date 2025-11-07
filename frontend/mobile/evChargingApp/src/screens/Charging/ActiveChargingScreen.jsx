import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import chargingService from '../../services/chargingService';
import { theme } from '../../config/theme';
import { API_BASE_URL } from '../../config/env';

const ActiveChargingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params;
  const { accessToken } = useSelector((state) => state.auth);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // 'pause', 'resume', 'stop'

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const { data } = await chargingService.getSession(sessionId);
        setSession(data);
      } catch (err) {
        setError('Không thể tải thông tin phiên sạc.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
      query: { sessionId },
    });

    socket.on('connect', () => {
      console.log('Connected to charging session socket');
    });

    socket.on('charging_update', (data) => {
      setSession((prev) => ({ ...prev, ...data }));
    });

    socket.on('session_terminated', (data) => {
      Alert.alert('Phiên sạc đã kết thúc', data.message || 'Phiên sạc của bạn đã hoàn tất.', [
        { text: 'OK', onPress: () => navigation.navigate('ChargingSummary', { sessionId }) },
      ]);
    });

    socket.on('error', (err) => {
      setError(err.message || 'Lỗi kết nối WebSocket.');
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, accessToken, navigation]);

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

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!session) {
    return <View style={styles.centered}><Text>Không tìm thấy thông tin phiên sạc.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Đang sạc...</Title>
          <Paragraph>{session.station_name}</Paragraph>
          <Text>Cổng sạc: {session.connector_id}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Năng lượng</Text>
            <Text style={styles.statValue}>{session.energy_consumed?.toFixed(2) || 0} kWh</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Thời gian</Text>
            <Text style={styles.statValue}>{new Date(session.duration * 1000).toISOString().substr(11, 8)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Chi phí</Text>
            <Text style={styles.statValue}>{session.cost?.toLocaleString('vi-VN') || 0} ₫</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.controlsContainer}>
        {session.status === 'CHARGING' ? (
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
          color={theme.colors.error}
          onPress={() => handleAction('stop')}
          loading={actionLoading === 'stop'}
          disabled={actionLoading}
          style={styles.stopButton}
          icon="stop-circle"
        >
          Dừng sạc
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
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
    color: theme.colors.onSurface + '80',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
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

export default ActiveChargingScreen;

