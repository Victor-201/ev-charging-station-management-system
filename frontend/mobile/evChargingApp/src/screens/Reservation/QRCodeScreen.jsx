import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

const QRCodeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { reservation } = route.params || {};
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!reservation) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt chỗ');
      navigation.goBack();
      return;
    }

    // Calculate time remaining until reservation start
    const calculateTimeRemaining = () => {
      const now = new Date();
      const reservationDate = new Date(reservation.date);
      const [startHour, startMinute] = reservation.start_time.split(':');
      reservationDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const diff = reservationDate - now;

      if (diff < 0) {
        return { expired: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, navigation]);

  const handleShare = async () => {
    try {
      const message = `Mã đặt chỗ: ${reservation.id}\nTrạm: ${reservation.station_name}\nThời gian: ${reservation.time}\nNgày: ${reservation.date}`;
      await Share.share({
        message,
        title: 'Chia sẻ mã đặt chỗ',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Hủy đặt chỗ',
      'Bạn có chắc chắn muốn hủy đặt chỗ này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt chỗ',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to cancel reservation
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!reservation) {
    return null;
  }

  const qrData = JSON.stringify({
    id: reservation.id,
    station_id: reservation.station_id,
    date: reservation.date,
    time: reservation.time,
    connector_type: reservation.connector_type,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mã QR đặt chỗ</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* QR Code Container */}
      <View style={styles.content}>
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrData}
              size={QR_SIZE}
              color={colors.onSurface}
              backgroundColor={colors.surface}
            />
          </View>

          {/* Reservation Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="confirmation-number" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Mã đặt chỗ:</Text>
              <Text style={styles.infoValue}>{reservation.id}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Icon name="ev-station" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Trạm sạc:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {reservation.station_name}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Icon name="event" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Ngày:</Text>
              <Text style={styles.infoValue}>{reservation.date}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Icon name="access-time" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Thời gian:</Text>
              <Text style={styles.infoValue}>{reservation.time}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Icon name="power" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Loại cổng:</Text>
              <Text style={styles.infoValue}>{reservation.connector_type}</Text>
            </View>
          </View>
        </View>

        {/* Countdown Timer */}
        {timeRemaining && !timeRemaining.expired && (
          <View style={styles.timerCard}>
            <Icon name="timer" size={24} color={colors.warning} />
            <Text style={styles.timerLabel}>Thời gian còn lại:</Text>
            <View style={styles.timerDisplay}>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{String(timeRemaining.hours).padStart(2, '0')}</Text>
                <Text style={styles.timerUnitLabel}>Giờ</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{String(timeRemaining.minutes).padStart(2, '0')}</Text>
                <Text style={styles.timerUnitLabel}>Phút</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{String(timeRemaining.seconds).padStart(2, '0')}</Text>
                <Text style={styles.timerUnitLabel}>Giây</Text>
              </View>
            </View>
          </View>
        )}

        {timeRemaining && timeRemaining.expired && (
          <View style={[styles.timerCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="error-outline" size={24} color={colors.error} />
            <Text style={[styles.timerLabel, { color: colors.error }]}>
              Đặt chỗ đã hết hạn
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng:</Text>
          <View style={styles.instructionItem}>
            <Icon name="looks-one" size={20} color={colors.primary} />
            <Text style={styles.instructionText}>
              Đến trạm sạc trước thời gian đặt chỗ 5-10 phút
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="looks-two" size={20} color={colors.primary} />
            <Text style={styles.instructionText}>
              Quét mã QR tại trụ sạc hoặc cho nhân viên
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="looks-3" size={20} color={colors.primary} />
            <Text style={styles.instructionText}>
              Cắm dây sạc và bắt đầu phiên sạc
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        {reservation.status === 'confirmed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Icon name="cancel" size={20} color={colors.error} />
            <Text style={styles.cancelButtonText}>Hủy đặt chỗ</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    shareButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    qrContainer: {
      alignItems: 'center',
    },
    qrWrapper: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      marginBottom: 20,
    },


    infoCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    infoValue: {
      flex: 1,
      fontSize: 14,
      color: colors.onSurface,
      fontWeight: '600',
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: colors.surfaceVariant,
      marginVertical: 12,
    },
    timerCard: {
      backgroundColor: colors.warningContainer,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    timerLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 8,
      marginBottom: 12,
    },
    timerDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timerUnit: {
      alignItems: 'center',
    },
    timerValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.warning,
    },
    timerUnitLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    timerSeparator: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.warning,
    },
    instructionsCard: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onPrimaryContainer,
      marginBottom: 12,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    instructionText: {
      flex: 1,
      fontSize: 14,
      color: colors.onPrimaryContainer,
      lineHeight: 20,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorContainer,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
  });

export default QRCodeScreen;