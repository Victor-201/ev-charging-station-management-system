import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
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

  const { qrData, reservationId, stationName, expiresAt } = route.params || {};
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!qrData || !expiresAt) {
      Alert.alert('Lỗi', 'Dữ liệu mã QR không hợp lệ.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiryDate = new Date(expiresAt);
      const diff = expiryDate.getTime() - now.getTime();

      if (diff < 0) {
        return { expired: true };
      }

      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { minutes, seconds, expired: false };
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, expiresAt, navigation]);

  if (!qrData) {
    return null; // Render nothing if data is invalid
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bắt đầu phiên sạc</Text>
        <View style={{ width: 40 }} />{/* Placeholder for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stationName}>{stationName}</Text>
        <Text style={styles.instructions}>Đưa mã QR này vào máy quét tại trụ sạc</Text>

        <View style={styles.qrWrapper}>
          <QRCode value={qrData} size={QR_SIZE} />
        </View>

        {timeRemaining && !timeRemaining.expired && (
          <View style={styles.timerCard}>
            <Icon name="timer" size={24} color={colors.primary} />
            <Text style={styles.timerLabel}>Mã sẽ hết hạn sau:</Text>
            <Text style={styles.timerValue}>
              {String(timeRemaining.minutes).padStart(2, '0')}:{
                String(timeRemaining.seconds).padStart(2, '0')
              }
            </Text>
          </View>
        )}

        {timeRemaining && timeRemaining.expired && (
          <View style={[styles.timerCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="error-outline" size={24} color={colors.error} />
            <Text style={[styles.timerLabel, { color: colors.error }]}>Mã QR đã hết hạn</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="confirmation-number" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Mã đặt chỗ:</Text>
            <Text style={styles.infoValue}>{reservationId}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </ScrollView>
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
    content: {
      padding: 20,
      alignItems: 'center',
    },
    stationName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    instructions: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
    },
    qrWrapper: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      marginBottom: 24,
    },
    timerCard: {
      width: '100%',
      backgroundColor: colors.primaryContainer,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    timerLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
      marginBottom: 8,
    },
    timerValue: {
      fontSize: 40,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    infoCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoLabel: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 16,
      color: colors.onSurface,
      fontWeight: '600',
    },
    closeButton: {
      marginTop: 16,
      backgroundColor: colors.secondaryContainer,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
      width: '100%',
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSecondaryContainer,
    },
  });

export default QRCodeScreen;