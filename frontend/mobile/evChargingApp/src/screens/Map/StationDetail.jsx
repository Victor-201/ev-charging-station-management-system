import { useEffect, useState, useMemo } from 'react';
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
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  connectorBadgeSelected: {
    backgroundColor: colors.primary,
  },
  connectorText: {
    color: colors.primary,
    fontWeight: '500',
  },
  connectorTextSelected: {
    color: colors.onPrimary,
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
  pointContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pointBadge: {
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  pointBadgeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  pointBadgeDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.surfaceDisabled,
  },
  pointText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  pointTextSelected: {
    color: colors.onPrimaryContainer,
  },
  pointTextDisabled: {
    color: colors.onSurfaceDisabled,
  },
  pointStatus: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  pointStatusSelected: {
    color: colors.onPrimaryContainer,
  },
  pointStatusDisabled: {
    color: colors.onSurfaceDisabled,
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

const InfoBox = ({ icon, label, value, styles, colors }) => {
  return (
    <View style={styles.infoBox}>
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={styles.infoBoxLabel}>{label}</Text>
      <Text style={styles.infoBoxValue}>{value}</Text>
    </View>
  );
};

export default function StationDetail({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { id } = route.params;
  const dispatch = useDispatch();
  const { selectedStation: station, loading, error } = useSelector((state) => state.stations);
  const { user } = useSelector((state) => state.auth);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // ✅ CRITICAL: All hooks must be called BEFORE any conditional returns
  // Calculate availablePoints using useMemo
  const availablePoints = useMemo(() => {
    if (!station || !selectedConnector) return [];
    return (station.charging_points || []).filter(
      (p) => p.connector_type === selectedConnector
    );
  }, [station, selectedConnector]);

  // Calculate isAvailable
  const isAvailable = useMemo(() => {
    return station?.status === 'active' && (station?.available_ports || 0) > 0;
  }, [station]);

  useEffect(() => {
    if (id) {
      dispatch(getStationById(id));
      dispatch(getStationPricing(id));
    }
  }, [id, dispatch]);

  const openDirections = () => {
    if (!station) return;

    const { latitude, longitude, name } = station;

    // Validate coordinates - ensure they are numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      Alert.alert('Lỗi', 'Không có thông tin vị trí của trạm sạc.');
      return;
    }

    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(name || 'EV Station')}`,
      android: `https://www.openstreetmap.org/directions?to=${lat},${lng}`,
    });

    Linking.openURL(url).catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ.');
    });
  };

  const handleBookStation = () => {
    if (station && selectedPoint) {
      navigation.navigate('ScheduleBooking', {
        stationId: station.id,
        station: station,
        pointId: selectedPoint.id,
        connectorType: selectedConnector,
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
    const userId = user?.user_id || user?.id;
    if (!userId || !station?.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tham gia danh sách chờ');
      return;
    }

    setJoiningWaitlist(true);
    try {
      await reservationService.addToWaitlist({
        user_id: userId,
        station_id: station.id,
        connector_type: station.connector_types?.[0] || 'Type2', // Default to first available type
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

  // ✅ NOW it's safe to have conditional returns (after all hooks)
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
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy trạm sạc</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.stationName, { color: colors.onSurface }]}>{station.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: station.status === 'active' ? colors.success : colors.error }]}>
          <Text style={[styles.statusText, { color: colors.onPrimary }]}>{station.status === 'active' ? 'Hoạt động' : 'Bảo trì'}</Text>
        </View>
      </View>

      <Text style={[styles.address, { color: colors.onSurfaceVariant }]}>{station.address}</Text>

      <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
        <InfoBox icon="power" label="Khả dụng" value={`${station.available_ports}/${station.total_ports}`} styles={styles} colors={colors} />
        <InfoBox icon="star" label="Đánh giá" value={`${station.rating} / 5.0`} styles={styles} colors={colors} />
        {station.pricing ? (
          <View style={styles.infoBox}>
            <Icon name="attach-money" size={24} color={colors.primary} />
            <Text style={styles.infoBoxLabel}>Bảng giá</Text>
            {station.pricing.map((p, i) => (
              <Text key={i} style={styles.infoBoxValue} numberOfLines={1} ellipsizeMode="tail">{p.name}: {p.price.toLocaleString()}đ</Text>
            ))}
          </View>
        ) : (
          <InfoBox icon="attach-money" label="Giá" value={`${(station.price_per_kwh || 0).toLocaleString()}đ / kWh`} styles={styles} colors={colors} />
        )}
      </View>

      {station.connector_types && Array.isArray(station.connector_types) && station.connector_types.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Chọn loại cổng sạc</Text>
          <View style={styles.connectorContainer}>
            {station.connector_types.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.connectorBadge,
                  selectedConnector === type && styles.connectorBadgeSelected,
                ]}
                onPress={() => {
                  setSelectedConnector(type);
                  setSelectedPoint(null); // Reset point selection
                }}
              >
                <Text
                  style={[
                    styles.connectorText,
                    selectedConnector === type && styles.connectorTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedConnector && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>2. Chọn điểm sạc</Text>
          {availablePoints.length > 0 ? (
            <View style={styles.pointContainer}>
              {availablePoints.map((point) => {
                const isPointSelected = selectedPoint?.id === point.id;
                const isPointDisabled = point.status !== 'available';

                return (
                  <TouchableOpacity
                    key={point.id}
                    style={[
                      styles.pointBadge,
                      { borderColor: colors.surfaceVariant, backgroundColor: colors.surface },
                      isPointSelected && [styles.pointBadgeSelected, { borderColor: colors.primary, backgroundColor: colors.primaryContainer }],
                      isPointDisabled && [styles.pointBadgeDisabled, { backgroundColor: colors.surfaceDisabled, borderColor: colors.surfaceDisabled }],
                    ]}
                    onPress={() => {
                      if (!isPointDisabled) {
                        setSelectedPoint(point);
                      }
                    }}
                    disabled={isPointDisabled}
                  >
                    <Text
                      style={[
                        styles.pointText,
                        { color: colors.onSurface },
                        isPointSelected && [styles.pointTextSelected, { color: colors.onPrimaryContainer }],
                        isPointDisabled && [styles.pointTextDisabled, { color: colors.onSurfaceDisabled }],
                      ]}
                    >
                      {point.point_name || `P${point.id}`}
                    </Text>
                    <Text
                      style={[
                        styles.pointStatus,
                        { color: colors.onSurfaceVariant },
                        isPointSelected && [styles.pointStatusSelected, { color: colors.onPrimaryContainer }],
                        isPointDisabled && [styles.pointStatusDisabled, { color: colors.onSurfaceDisabled }],
                      ]}
                    >
                      {point.status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: colors.onSurfaceVariant }}>
              Không có điểm sạc nào cho loại cổng này.
            </Text>
          )}
        </View>
      )}

      {station.amenities && Array.isArray(station.amenities) && station.amenities.length > 0 && (
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
          style={[styles.directionsButton, { backgroundColor: colors.secondaryContainer }]}
          onPress={openDirections}
        >
          <Icon name="directions" size={20} color={colors.onSecondaryContainer} />
          <Text style={[styles.directionsButtonText, { color: colors.onSecondaryContainer }]}>Chỉ đường</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }, !selectedPoint && styles.disabledButton]}
          onPress={handleBookStation}
          disabled={!selectedPoint}
        >
          <Text style={[styles.bookButtonText, { color: colors.onPrimary }]}>
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
