import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

export default function ScheduleBooking() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stationId, station } = route.params;
  const user = useSelector((state) => state.auth.user);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  // Sample time slots - sẽ được thay thế bằng API call
  const timeSlots = [
    { id: '1', time: '08:00', duration: 60, available: true },
    { id: '2', time: '09:00', duration: 60, available: true },
    { id: '3', time: '10:00', duration: 60, available: false },
    { id: '4', time: '11:00', duration: 60, available: true },
    { id: '5', time: '12:00', duration: 60, available: true },
    { id: '6', time: '13:00', duration: 60, available: false },
    { id: '7', time: '14:00', duration: 60, available: true },
    { id: '8', time: '15:00', duration: 60, available: true },
    { id: '9', time: '16:00', duration: 60, available: true },
    { id: '10', time: '17:00', duration: 60, available: false },
    { id: '11', time: '18:00', duration: 60, available: true },
    { id: '12', time: '19:00', duration: 60, available: true },
  ];

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      // TODO: Call station service API to get available slots
      setAvailableSlots(timeSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch trống');
    } finally {
      setLoading(false);
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
        { text: 'Xác nhận', onPress: confirmBooking }
      ]
    );
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);
      // TODO: Call booking API
      
      Alert.alert(
        'Đặt chỗ thành công',
        'Bạn đã đặt chỗ thành công. Vui lòng đến đúng giờ để sạc xe.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Reservation')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Không thể đặt chỗ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
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
              <Icon name="power" size={16} color="#666" />
              <Text style={styles.metaText}>
                {station.available_ports}/{station.total_ports} cổng
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="attach-money" size={16} color="#666" />
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
            <View style={styles.timeGrid}>
              {availableSlots.map((slot) => (
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
                    color={selectedConnector === connector ? 'white' : '#2196F3'} 
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
            style={[styles.bookButton, loading && styles.disabledButton]}
            onPress={handleBooking}
            disabled={loading}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Đang đặt chỗ...' : 'Đặt chỗ ngay'}
            </Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  stationInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    borderColor: '#e0e0e0',
    minWidth: 70,
  },
  selectedDateCard: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateText: {
    color: 'white',
  },
  todayIndicator: {
    marginTop: 4,
  },
  todayText: {
    fontSize: 10,
    color: '#2196F3',
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
    borderColor: '#e0e0e0',
    minWidth: 80,
    backgroundColor: 'white',
  },
  selectedTimeSlot: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  unavailableSlot: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedTimeText: {
    color: 'white',
  },
  unavailableText: {
    color: '#ccc',
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
    borderColor: '#2196F3',
    backgroundColor: 'white',
  },
  selectedConnector: {
    backgroundColor: '#2196F3',
  },
  connectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 8,
  },
  selectedConnectorText: {
    color: 'white',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
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
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  costText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
