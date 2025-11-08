import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import reservationService from '../../services/reservationService';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onPrimary,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.onBackground,
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
    color: colors.onSurface,
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
    color: colors.onPrimary,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
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
    color: colors.onSurface,
    opacity: 0.7,
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
    color: colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ReservationList() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);
  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);



  useFocusEffect(
    React.useCallback(() => {
      loadReservations();
    }, [])
  );

  const loadReservations = async () => {
    try {
      setRefreshing(true);
      if (!user?.id) return;
      const response = await reservationService.getUserReservations(user.id);
      const userReservations = response?.data || response;
      setReservations(Array.isArray(userReservations) ? userReservations : []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đặt chỗ.');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'completed': return colors.accent;
      default: return colors.onSurface;
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
          <Icon name="event" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
          <Text style={styles.detailText}>{item.date} • {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="power" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
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
          <Icon name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-note" size={64} color={colors.onSurface} style={{ opacity: 0.3 }} />
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


