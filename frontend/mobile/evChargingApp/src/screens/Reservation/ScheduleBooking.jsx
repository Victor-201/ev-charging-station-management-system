import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { useTheme } from 'react-native-paper';
import useReservations from '../../hooks/useReservations';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand50, // Light background
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  content: {
    flex: 1,
  },
  stationInfo: {
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
    marginBottom: 12,
  },
  stationMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    minWidth: 70,
  },
  selectedDateCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayName: {
    fontSize: 12,
    color: colors.onSurface,
    opacity: 0.7,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  selectedDateText: {
    color: colors.onPrimary,
  },
  todayIndicator: {
    marginTop: 4,
  },
  todayText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '500',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    minWidth: 80,
    backgroundColor: colors.surface,
  },
  selectedTimeSlot: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unavailableSlot: {
    backgroundColor: colors.brand50,
    borderColor: colors.outline,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  durationText: {
    fontSize: 12,
    color: colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  selectedTimeText: {
    color: colors.onPrimary,
  },
  unavailableText: {
    color: colors.onSurfaceVariant,
  },
  connectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  connectorCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  selectedConnector: {
    backgroundColor: colors.accent,
  },
  connectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 8,
  },
  selectedConnectorText: {
    color: colors.onPrimary,
  },
  summaryCard: {
    backgroundColor: colors.brand50,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  costText: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  bookButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.surfaceDisabled,
  },
  bookButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ScheduleBooking() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const { stationId, station } = route.params;
  const user = useSelector((state) => state.auth.user);

  const {
    availableSlots: slotsFromRedux,
    slotsLoading,
    loading: reservationLoading,
    fetchAvailableSlots,
    createNewReservation,
  } = useReservations();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedConnector, setSelectedConnector] = useState(null);

  // Generate next 7 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: date,
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.getMonth() + 1,
        isToday: i === 0
      });
    }
    return dates;
  };

  const [availableDates] = useState(generateDates());



  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    try {
      const dateString = selectedDate.date.toISOString().split('T')[0];
      await fetchAvailableSlots(stationId, dateString);
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch trống cho ngày đã chọn.');
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time selection when date changes
  };

  const handleTimeSlotSelect = (slot) => {
    if (slot.available) {
      setSelectedTimeSlot(slot);
    }
  };

  const handleConnectorSelect = (connector) => {
    setSelectedConnector(connector);
  };

  const calculateTotalCost = () => {
    if (!selectedTimeSlot) return 0;
    // Estimate 30 kWh for 1 hour charging
    const estimatedKWh = 30;
    return estimatedKWh * station.price_per_kwh;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedConnector) {
      Alert.alert(
        'Thông tin chưa đầy đủ',
        'Vui lòng chọn ngày, giờ và loại cổng sạc'
      );
      return;
    }

    const bookingData = {
      user_id: user.id,
      station_id: stationId,
      date: selectedDate.date.toISOString().split('T')[0],
      start_time: selectedTimeSlot.time,
      duration: selectedTimeSlot.duration,
      connector_type: selectedConnector,
      estimated_cost: calculateTotalCost(),
    };

    Alert.alert(
      'Xác nhận đặt chỗ',
      `Đặt chỗ tại ${station.name}\nNgày: ${selectedDate.date.toLocaleDateString('vi-VN')}\nGiờ: ${selectedTimeSlot.time}\nLoại cổng: ${selectedConnector}\nUớc tính: ${calculateTotalCost().toLocaleString()} VND`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: () => confirmBooking(bookingData) }
      ]
    );
  };

  const confirmBooking = async (bookingData) => {
    try {
      const response = await createNewReservation(bookingData);
      const reservationId = response?.id || response?.reservation_id || response?.data?.id;

      Alert.alert(
        'Đặt chỗ thành công!',
        `Mã đặt chỗ của bạn là: ${reservationId}. Vui lòng kiểm tra trong mục Đặt chỗ.`,
        [
          {
            text: 'Xem đặt chỗ',
            onPress: () => navigation.navigate('Profile', {
              screen: 'ReservationStack',
              params: { screen: 'ReservationMain' }
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error?.message || 'Không thể đặt chỗ. Vui lòng thử lại.';
      Alert.alert('Lỗi đặt chỗ', errorMessage);
    }
  };

  const formatDate = (date) => {
    return date.date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt chỗ sạc</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationAddress}>{station.address}</Text>
          <View style={styles.stationMeta}>
            <View style={styles.metaItem}>
              <Icon name="power" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
              <Text style={styles.metaText}>
                {station.available_ports}/{station.total_ports} cổng
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="attach-money" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
              <Text style={styles.metaText}>
                {station.price_per_kwh.toLocaleString()} VND/kWh
              </Text>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateContainer}>
              {availableDates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate?.date.getTime() === date.date.getTime() && styles.selectedDateCard
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dayName,
                    selectedDate?.date.getTime() === date.date.getTime() && styles.selectedDateText
                  ]}>
                    {date.dayName}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    selectedDate?.date.getTime() === date.date.getTime() && styles.selectedDateText
                  ]}>
                    {date.dayNumber}
                  </Text>
                  {date.isToday && (
                    <View style={styles.todayIndicator}>
                      <Text style={styles.todayText}>Hôm nay</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Time Slot Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Chọn giờ - {formatDate(selectedDate)}
            </Text>
            {slotsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.onSurface, opacity: 0.7 }}>
                  Đang tải lịch trống...
                </Text>
              </View>
            ) : slotsFromRedux.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.onSurface, opacity: 0.7 }}>
                  Không có lịch trống cho ngày này
                </Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {slotsFromRedux.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.unavailableSlot,
                    selectedTimeSlot?.id === slot.id && styles.selectedTimeSlot
                  ]}
                  onPress={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.timeText,
                    !slot.available && styles.unavailableText,
                    selectedTimeSlot?.id === slot.id && styles.selectedTimeText
                  ]}>
                    {slot.time}
                  </Text>
                  <Text style={[
                    styles.durationText,
                    !slot.available && styles.unavailableText,
                    selectedTimeSlot?.id === slot.id && styles.selectedTimeText
                  ]}>
                    {slot.duration}p
                  </Text>
                </TouchableOpacity>
              ))}
              </View>
            )}
          </View>
        )}

        {/* Connector Type Selection */}
        {selectedTimeSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn loại cổng sạc</Text>
            <View style={styles.connectorContainer}>
              {station.connector_types.map((connector, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.connectorCard,
                    selectedConnector === connector && styles.selectedConnector
                  ]}
                  onPress={() => handleConnectorSelect(connector)}
                >
                  <Icon 
                    name="power" 
                    size={24} 
                    color={selectedConnector === connector ? colors.onPrimary : colors.accent}
                  />
                  <Text style={[
                    styles.connectorText,
                    selectedConnector === connector && styles.selectedConnectorText
                  ]}>
                    {connector}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTimeSlot && selectedConnector && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tóm tắt đặt chỗ</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ngày giờ:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate.date.toLocaleDateString('vi-VN')} • {selectedTimeSlot.time}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Thời gian:</Text>
                <Text style={styles.summaryValue}>{selectedTimeSlot.duration} phút</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loại cổng:</Text>
                <Text style={styles.summaryValue}>{selectedConnector}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ước tính chi phí:</Text>
                <Text style={[styles.summaryValue, styles.costText]}>
                  {calculateTotalCost().toLocaleString()} VND
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      {selectedDate && selectedTimeSlot && selectedConnector && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.bookButton, reservationLoading && styles.disabledButton]}
            onPress={handleBooking}
            disabled={reservationLoading}
          >
            <Text style={styles.bookButtonText}>
              {reservationLoading ? 'Đang đặt chỗ...' : 'Đặt chỗ ngay'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}


