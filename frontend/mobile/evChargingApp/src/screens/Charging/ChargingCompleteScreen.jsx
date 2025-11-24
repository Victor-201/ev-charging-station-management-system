import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';

import chargingService from '../../services/chargingService';
import ChargingCompleteHeader from '../../components/charging/ChargingCompleteHeader';
import InfoRow from '../../components/common/InfoRow';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, marginBottom: 16 },
  content: { padding: 16, marginTop: -32 }, // Pull up to overlap header
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    backgroundColor: colors.surface,
  },
});

const ChargingCompleteScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = async () => {
    if (!sessionId) {
      setError('Không có ID phiên sạc.');
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin phiên sạc.'}</Text>
        <Button onPress={fetchSession}>Thử lại</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <ChargingCompleteHeader />
        <View style={styles.content}>
          <View style={styles.card}>
            <InfoRow icon="map-marker-outline" label="Trạm sạc" value={session.station_name} />
            <InfoRow icon="flash" label="Năng lượng" value={`${session.energy_consumed?.toFixed(2)} kWh`} />
            <InfoRow icon="timer-outline" label="Thời gian" value={`${new Date(session.duration * 1000).toISOString().substr(11, 8)}`} />
            <InfoRow icon="cash" label="Tổng chi phí" value={`${session.cost?.toLocaleString('vi-VN')} ₫`} isLast />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="receipt"
          style={{ marginBottom: 12 }}
          onPress={() => navigation.navigate('History', {
            screen: 'SessionDetail',
            params: { sessionId: session.id || session.session_id }
          })}
        >
          Xem chi tiết
        </Button>
        <Button
          onPress={() => navigation.popToTop()}
        >
          Về màn hình chính
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ChargingCompleteScreen;

