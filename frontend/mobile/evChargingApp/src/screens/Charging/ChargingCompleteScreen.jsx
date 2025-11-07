import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, Divider, Avatar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import chargingService from '../../services/chargingService';
import { theme } from '../../config/theme';

const ChargingCompleteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

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
      <View style={styles.header}>
        <Avatar.Icon size={64} icon="check-circle" style={styles.icon} />
        <Title style={styles.title}>Sạc Hoàn Tất</Title>
        <Text style={styles.subtitle}>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Tóm tắt phiên sạc</Title>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạm sạc:</Text>
            <Text style={styles.value}>{session.station_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Năng lượng tiêu thụ:</Text>
            <Text style={styles.value}>{session.energy_consumed?.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian sạc:</Text>
            <Text style={styles.value}>{new Date(session.duration * 1000).toISOString().substr(11, 8)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng chi phí</Text>
            <Text style={styles.totalValue}>{session.cost?.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          icon="receipt"
          style={styles.button}
          onPress={() => navigation.navigate('Invoice', { invoiceId: session.invoice_id })}
        >
          Xem hóa đơn
        </Button>
        <Button 
          mode="outlined" 
          icon="star-outline"
          style={styles.button}
          onPress={() => { /* TODO: Navigate to Rating screen */ }}
        >
          Đánh giá trải nghiệm
        </Button>
        <Button 
          onPress={() => navigation.navigate('Home')}
          style={styles.homeButton}
        >
          Về trang chủ
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.primary,
  },
  icon: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onPrimary + 'B3',
    marginTop: 4,
  },
  card: {
    margin: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: theme.colors.onSurface + '80',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionsContainer: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
  homeButton: {
    marginTop: 8,
  },
});

export default ChargingCompleteScreen;

