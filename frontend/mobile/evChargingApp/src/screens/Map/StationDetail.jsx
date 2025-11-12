import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getStationById, getStationPricing } from '../../store/slices/stationSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import reservationService from '../../services/reservationService';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSurface,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  address: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginBottom: 24,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  infoBox: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoBoxLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  infoBoxValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.onSurface,
  },
  connectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  connectorBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  connectorText: {
    color: colors.onPrimaryContainer,
    fontWeight: '500',
  },
  amenitiesContainer: {
    gap: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityText: {
    fontSize: 16,
    color: colors.onSurface,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
  },
  directionsButtonText: {
    color: colors.onSecondaryContainer,
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.onSurface + '30',
  },
  bookButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  waitlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  waitlistButtonText: {
    color: colors.onPrimaryContainer,
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  reportButtonText: {
    color: colors.onErrorContainer,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function StationDetail({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { id } = route.params;
  const dispatch = useDispatch();
  const { selectedStation: station, loading, error } = useSelector((state) => state.stations);
  const { user } = useSelector((state) => state.auth);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getStationById(id));
      dispatch(getStationPricing(id));
    }
  }, [id, dispatch]);

  const openDirections = () => {
    if (!station) return;

    const { latitude, longitude, name } = station;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(name)}`,
      android: `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ.');
    });
  };

  const handleBookStation = () => {
    if (station) {
      navigation.navigate('ScheduleBooking', {
        stationId: station.id,
        station: station
      });
    }
  };

  const handleReportIssue = () => {
    if (station) {
      navigation.navigate('ReportIssue', {
        station: station
      });
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user?.id || !station?.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tham gia danh sách chờ');
      return;
    }

    setJoiningWaitlist(true);
    try {
      const response = await reservationService.addToWaitlist({
        user_id: user.id,
        station_id: station.id,
        connector_type: station.connector_types?.[0] || 'Type 2', // Default to first available type
      });

      Alert.alert(
        'Thành công',
        'Bạn đã được thêm vào danh sách chờ. Chúng tôi sẽ thông báo khi có chỗ trống.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Join waitlist error:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể tham gia danh sách chờ. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const InfoBox = ({ icon, label, value }) => (
    <View style={styles.infoBox}>
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={styles.infoBoxLabel}>{label}</Text>
      <Text style={styles.infoBoxValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!station) {
    return null;
  }

  const isAvailable = station.status === 'active' && station.available_ports > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.stationName}>{station.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: station.status === 'active' ? colors.success : colors.error }]}>
          <Text style={styles.statusText}>{station.status === 'active' ? 'Hoạt động' : 'Bảo trì'}</Text>
        </View>
      </View>

      <Text style={styles.address}>{station.address}</Text>

      <View style={styles.infoSection}>
        <InfoBox icon="power" label="Khả dụng" value={`${station.available_ports}/${station.total_ports}`} />
        <InfoBox icon="star" label="Đánh giá" value={`${station.rating} / 5.0`} />
        {station.pricing ? (
          <View style={styles.infoBox}>
            <Icon name="attach-money" size={24} color={colors.primary} />
            <Text style={styles.infoBoxLabel}>Bảng giá</Text>
            {station.pricing.map((p, i) => (
              <Text key={i} style={styles.infoBoxValue}>{p.name}: {p.price.toLocaleString()}đ</Text>
            ))}
          </View>
        ) : (
          <InfoBox icon="attach-money" label="Giá" value={`${(station.price_per_kwh || 0).toLocaleString()}đ / kWh`} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loại cổng sạc</Text>
        <View style={styles.connectorContainer}>
          {station.connector_types.map((type, index) => (
            <View key={index} style={styles.connectorBadge}>
              <Text style={styles.connectorText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      {station.amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.amenitiesContainer}>
            {station.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Icon name="check-circle" size={16} color={colors.primary} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={openDirections}
        >
          <Icon name="directions" size={20} color={colors.onSecondaryContainer} />
          <Text style={styles.directionsButtonText}>Chỉ đường</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bookButton, !isAvailable && styles.disabledButton]}
          onPress={handleBookStation}
          disabled={!isAvailable}
        >
          <Text style={styles.bookButtonText}>
            {isAvailable ? 'Đặt chỗ ngay' : 'Hết chỗ'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Waitlist Button - Show when no slots available */}
      {!isAvailable && station.status === 'active' && (
        <TouchableOpacity
          style={[styles.waitlistButton, joiningWaitlist && styles.disabledButton]}
          onPress={handleJoinWaitlist}
          disabled={joiningWaitlist}
        >
          <Icon name="schedule" size={20} color={colors.onPrimaryContainer} />
          <Text style={styles.waitlistButtonText}>
            {joiningWaitlist ? 'Đang xử lý...' : 'Tham gia danh sách chờ'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={handleReportIssue}
      >
        <Icon name="report-problem" size={20} color={colors.onErrorContainer} />
        <Text style={styles.reportButtonText}>Báo cáo vấn đề</Text>
      </TouchableOpacity>
          </ScrollView>
    </SafeAreaView>
  );
}
