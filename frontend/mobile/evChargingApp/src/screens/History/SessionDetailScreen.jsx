import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, Divider, List } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import chargingService from '../../services/chargingService';
import { theme } from '../../config/theme';

const SessionDetailScreen = () => {
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
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!session) {
    return <View style={styles.centered}><Text>Không tìm thấy thông tin phiên sạc.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{session.station_name}</Title>
          <Text>{new Date(session.start_time).toLocaleDateString('vi-VN')}</Text>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Năng lượng:</Text>
            <Text style={styles.value}>{session.energy_consumed?.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>{new Date(session.duration * 1000).toISOString().substr(11, 8)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Chi phí:</Text>
            <Text style={styles.value}>{session.cost?.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Dòng thời gian</Title>
          {events.map((event, index) => (
            <List.Item
              key={index}
              title={event.event_type}
              description={event.message}
              left={() => <List.Icon icon="circle-small" />}
              right={() => <Text>{formatDate(event.timestamp)}</Text>}
            />
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          icon="download"
          onPress={() => { /* TODO: Implement invoice download */ }}
        >
          Tải hóa đơn
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 8,
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
    margin: 8,
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
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
  },
});

export default SessionDetailScreen;

