import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ReservationList() {
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data - sẽ được thay thế bằng API call
  const sampleReservations = [
    {
      id: '1',
      station_name: 'Trạm sạc Central Park',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      date: '2024-11-05',
      time: '14:00 - 15:00',
      status: 'confirmed',
      port_type: 'Type 2',
      created_at: '2024-11-04T10:30:00Z'
    },
    {
      id: '2',
      station_name: 'Trạm sạc Landmark 81',
      address: '456 Vinhomes, Bình Thạnh, TP.HCM',
      date: '2024-11-06',
      time: '10:00 - 11:00',
      status: 'pending',
      port_type: 'CCS',
      created_at: '2024-11-04T15:20:00Z'
    }
  ];

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      // TODO: Call reservation API
      setReservations(sampleReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const renderReservationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reservationCard}
      onPress={() => navigation.navigate('ReservationDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.stationName}>{item.station_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.address}>{item.address}</Text>
      
      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.detailText}>{item.date} • {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="power" size={16} color="#666" />
          <Text style={styles.detailText}>Cổng {item.port_type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách đặt chỗ</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-note" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có đặt chỗ nào</Text>
          <Text style={styles.emptySubtitle}>
            Hãy tìm trạm sạc và đặt chỗ cho lần sạc tiếp theo
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.primaryButtonText}>Tìm trạm sạc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  reservationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reservationDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
