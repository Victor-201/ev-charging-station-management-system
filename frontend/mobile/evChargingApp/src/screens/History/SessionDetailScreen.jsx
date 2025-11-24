import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';

import chargingService from '../../services/chargingService';
import SessionSummaryMetrics from '../../components/session/SessionSummaryMetrics';
import SessionInfoCard from '../../components/session/SessionInfoCard';
import SessionTimeline from '../../components/session/SessionTimeline';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, marginBottom: 16 },
  // Header
  header: { height: 120, backgroundColor: colors.primary },
  headerContent: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'android' ? 16 : 50 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 16 },
  // Map
  mapContainer: { paddingHorizontal: 16, marginTop: 16 },
  map: { height: 150, borderRadius: 12, overflow: 'hidden' },
  // Actions
  actionsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.outline },
  actionButton: { flex: 1 },
});

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

  const fetchData = async () => {
    const sessionId = initialSession?.id || initialSession?.session_id || sessionIdFromNav;
    if (!sessionId) {
      setError('Không có ID phiên sạc.');
      setLoading(false);
      return;
    }

    try {
      const sessionPromise = session ? Promise.resolve(session) : chargingService.getSession(sessionId);
      const eventsPromise = chargingService.getEvents(sessionId);

      const [sessionRes, eventsRes] = await Promise.all([sessionPromise, eventsPromise]);

      setSession(sessionRes.data || sessionRes);
      setEvents(eventsRes.data?.events || []);
    } catch (err) {
      setError('Không thể tải chi tiết phiên sạc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialSession, sessionIdFromNav]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={fetchData}>Thử lại</Button>
      </View>
    );
  }

  if (!session) {
    return <View style={styles.centered}><Text>Không tìm thấy thông tin phiên sạc.</Text></View>;
  }

  const stationCoords = {
    latitude: session?.station_latitude || 10.776889,
    longitude: session?.station_longitude || 106.700722,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="arrow-left" size={24} color="#fff" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Chi tiết phiên sạc</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <SessionSummaryMetrics session={session} />

        <SessionInfoCard session={session} />

        {stationCoords.latitude && (
          <View style={styles.mapContainer}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.onBackground }}>Vị trí</Text>
            <View style={styles.map}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={stationCoords}
                pitchEnabled={false}
                rotateEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={stationCoords} />
              </MapView>
            </View>
          </View>
        )}

        <SessionTimeline events={events} />

      </ScrollView>

      <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
        <Button
          icon="receipt"
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('InvoiceScreen', { sessionId: session.id || session.session_id })}
        >
          Xem hóa đơn
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default SessionDetailScreen;

