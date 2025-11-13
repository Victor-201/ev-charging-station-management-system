import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Title, Button, ActivityIndicator, Divider, List } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import chargingService from '../../services/chargingService';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
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
    margin: 16,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
  },
  stationName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  date: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: colors.onSurface,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  actionsContainer: {
    padding: 16,
  },
  timelineItem: {
    paddingVertical: 4,
  },
  timelineTitle: {
    textTransform: 'capitalize',
    fontWeight: '500',
    color: colors.onSurface,
  },
  timelineDescription: {
    fontSize: 12,
    color: colors.onSurface,
    opacity: 0.7,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.onSurface,
    opacity: 0.7,
  }
});

const SessionDetailScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const { sessionId } = route.params;

  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sessionRes, eventsRes] = await Promise.all([
          chargingService.getSession(sessionId),
          chargingService.getSessionEvents(sessionId),
        ]);
        setSession(sessionRes.data);
        setEvents(eventsRes.data.events);
      } catch (err) {
        setError('Không thể tải chi tiết phiên sạc.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const formatDate = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleTimeString('vi-VN', options);
  };

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
      <View style={{ padding: 16 }}>
        <Text style={styles.stationName}>{session.station_name}</Text>
        <Text style={styles.date}>{new Date(session.start_time).toLocaleString('vi-VN')}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Năng lượng:</Text>
            <Text style={styles.value}>{session.energy_consumed?.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>{new Date(session.duration * 1000).toISOString().substr(11, 8)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Chi phí:</Text>
            <Text style={styles.value}>{session.cost?.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Dòng thời gian</Text>
          {events.map((event, index) => (
            <List.Item
              key={index}
              style={styles.timelineItem}
              title={event.event_type}
              titleStyle={styles.timelineTitle}
              description={event.message}
              descriptionStyle={styles.timelineDescription}
              left={() => <List.Icon icon="circle-small" color={colors.primary} />}
              right={() => <Text style={styles.timelineTime}>{formatDate(event.timestamp)}</Text>}
            />
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="receipt"
          onPress={() => navigation.navigate('InvoiceDetail', { id: session.invoice_id })}
        >
          Xem hóa đơn
        </Button>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionDetailScreen;

