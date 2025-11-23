import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, ActivityIndicator, Divider, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import chargingService from '../../services/chargingService';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.outline },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginLeft: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error },
  content: { padding: 16 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  stationName: { fontSize: 22, fontWeight: 'bold', color: colors.onSurface, marginBottom: 4 },
  date: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 16 },
  summaryMetrics: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  metricBox: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  metricLabel: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
  cost: { fontSize: 24, fontWeight: 'bold', color: colors.onSurface, textAlign: 'center', marginTop: 16 },
  timelineCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.onSurface, marginBottom: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  eventIcon: { marginRight: 16 },
  eventDetails: { flex: 1 },
  eventTitle: { fontWeight: '600', color: colors.onSurface, textTransform: 'capitalize' },
  eventTime: { fontSize: 12, color: colors.onSurfaceVariant },
});

// Helper to format duration from seconds to HH:MM:SS
const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

const SessionDetailScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { session: initialSession, sessionId: sessionIdFromNav } = route.params;

  const [session, setSession] = useState(initialSession);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = initialSession?.id || initialSession?.session_id || sessionIdFromNav;
    if (!sessionId) {
      setError('Không có ID phiên sạc.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Only fetch session if not passed via params
        const sessionPromise = session ? Promise.resolve(session) : chargingService.getSession(sessionId);
        const eventsPromise = chargingService.getSessionEvents(sessionId);

        const [sessionRes, eventsRes] = await Promise.all([sessionPromise, eventsPromise]);

        setSession(sessionRes.data || sessionRes);
        setEvents(eventsRes.data?.events || []);
      } catch (err) {
        setError('Không thể tải chi tiết phiên sạc.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialSession, sessionIdFromNav]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!session) {
    return <View style={styles.centered}><Text>Không tìm thấy thông tin phiên sạc.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color={colors.onSurface} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Chi tiết phiên sạc</Text>
      </View>
      <ScrollView>
        <View style={styles.content}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.stationName}>{session.station_name || 'Trạm sạc'}</Text>
            <Text style={styles.date}>{new Date(session.start_time).toLocaleString('vi-VN')}</Text>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.summaryMetrics}>
              <View style={styles.metricBox}>
                <Icon name="lightning-bolt" size={24} color={colors.primary} />
                <Text style={styles.metricValue}>{(session.energy_consumed || 0).toFixed(2)} kWh</Text>
                <Text style={styles.metricLabel}>Năng lượng</Text>
              </View>
              <View style={styles.metricBox}>
                <Icon name="timer-outline" size={24} color={colors.primary} />
                <Text style={styles.metricValue}>{formatDuration(session.duration)}</Text>
                <Text style={styles.metricLabel}>Thời gian</Text>
              </View>
            </View>
            <Text style={styles.cost}>{(session.cost || 0).toLocaleString('vi-VN')} ₫</Text>
          </View>

          {/* Timeline Card */}
          {events && events.length > 0 && (
            <View style={styles.timelineCard}>
              <Text style={styles.cardTitle}>Dòng thời gian</Text>
              {events.map((event, index) => (
                <View key={index} style={styles.eventRow}>
                  <Icon name="circle-medium" size={24} color={colors.primary} style={styles.eventIcon} />
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{event.event_type}</Text>
                    <Text style={styles.eventTime}>{new Date(event.timestamp).toLocaleTimeString('vi-VN')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionDetailScreen;

