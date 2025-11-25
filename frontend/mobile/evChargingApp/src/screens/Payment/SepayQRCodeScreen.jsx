/**
 * Sepay QR Code Screen
 * Displays QR code and bank transfer information
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import sepayService from '../../services/sepayService';
import { getWallet } from '../../store/slices/walletSlice';
import { logger } from '../../utils/logger';
import useSocket from '../../hooks/useSocket';

const SepayQRCodeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { transaction, amount } = route.params;
  const profile = useSelector(state => state.user?.profile);
  const userId = profile?.user_id || profile?.id;

  const [status, setStatus] = useState('pending'); // pending, checking, completed, failed
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Extract payment data from transaction
  const paymentData = {
    transaction_id: transaction?.id || transaction?.transaction_id,
    bank_name: 'Ngân hàng TMCP Á Châu (ACB)',
    account_number: transaction?.meta?.account_number || '45281677',
    account_name: transaction?.meta?.account_name || 'NGUYEN VAN THANG',
    transfer_content: transaction?.reference_code || transaction?.meta?.reference_code || '',
  };

  useEffect(() => {
    // Get QR code URL from backend response
    const url = sepayService.getQRCodeUrl(transaction);
    if (url) {
      setQrCodeUrl(url);
    } else {
      logger.error('No QR code URL found in transaction data');
      Alert.alert('Lỗi', 'Không thể tạo mã QR. Vui lòng thử lại.');
      navigation.goBack();
      return;
    }

    // Check payment status once initially
    checkPaymentStatus();

    // No need to return cleanup function as useSocket handles it
  }, [transaction]);

  // Setup socket event handlers for payment updates
  const paymentSocketHandlers = {
    'payment:update': (data) => {
      const transactionId = transaction?.id || transaction?.transaction_id;

      // Only process updates for our transaction
      if (data.transactionId === transactionId) {
        console.log('Received payment update via socket:', data);

        if (data.status === 'completed' || data.status === 'success') {
          handlePaymentSuccess(transactionId);
        } else if (data.status === 'failed') {
          handlePaymentFailure();
        }
      }
    }
  };

  // Initialize socket connection
  useSocket(paymentSocketHandlers);

  /**
   * Handle payment success
   */
  const handlePaymentSuccess = async (transactionId) => {
    setStatus('completed');

    // Refresh wallet balance
    if (userId) {
      dispatch(getWallet(userId));
    }

    // Optional local push in case server push hasn't arrived yet
    try {
      const { default: notificationService } = await import('../../services/notificationService');
      await notificationService.onDisplayNotification({
        notification: {
          title: 'Nạp tiền thành công',
          body: `Bạn vừa nạp ${sepayService.formatAmount(amount)} vào ví`,
        },
      });
    } catch {}

    // Navigate to success screen
    navigation.replace('TopupSuccessScreen', { amount, transactionId });
  };

  /**
   * Handle payment failure
   */
  const handlePaymentFailure = () => {
    setStatus('failed');

    Alert.alert(
      'Thất bại',
      'Giao dịch không thành công. Vui lòng thử lại.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  /**
   * Check payment status (called once initially)
   */
  const checkPaymentStatus = async () => {
    try {
      setStatus('checking');

      const transactionId = transaction?.id || transaction?.transaction_id;
      if (!transactionId) {
        logger.error('No transaction ID found');
        return;
      }

      const result = await sepayService.checkPaymentStatus(transactionId);

      if (result.status === 'completed' || result.status === 'success') {
        await handlePaymentSuccess(transactionId);
      } else if (result.status === 'failed') {
        handlePaymentFailure();
      } else {
        setStatus('pending');
      }
      }
    } catch (error) {
      logger.error('Failed to check payment status', error);
      setStatus('pending');
    }
  };

  /**
   * Copy to clipboard
   */
  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Đã sao chép', `${label} đã được sao chép`);
  };

  /**
   * Render bank info row
   */
  const renderInfoRow = (label, value, copyable = false) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value}</Text>
        {copyable && (
          <TouchableOpacity
            onPress={() => copyToClipboard(value, label)}
            style={styles.copyButton}
          >
            <Icon name="content-copy" size={20} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyển khoản</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Indicator */}
        <View style={styles.statusCard}>
          {status === 'checking' && (
            <ActivityIndicator size="small" color="#4CAF50" />
          )}
          <Text style={styles.statusText}>
            {status === 'pending' && '⏳ Đang chờ thanh toán...'}
            {status === 'checking' && '🔄 Đang kiểm tra...'}
            {status === 'completed' && '✅ Thanh toán thành công!'}
            {status === 'failed' && '❌ Thanh toán thất bại'}
          </Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Quét mã QR để chuyển khoản</Text>
          {qrCodeUrl ? (
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator size="large" color="#4CAF50" />
          )}
          <Text style={styles.qrSubtitle}>
            Sử dụng app ngân hàng để quét mã QR
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Bank Information */}
        <View style={styles.bankInfoCard}>
          <Text style={styles.cardTitle}>Thông tin chuyển khoản</Text>

          {renderInfoRow('Ngân hàng', paymentData.bank_name)}
          {renderInfoRow('Số tài khoản', paymentData.account_number, true)}
          {renderInfoRow('Tên tài khoản', paymentData.account_name)}
          {renderInfoRow('Số tiền', sepayService.formatAmount(amount), true)}
          {renderInfoRow('Nội dung', paymentData.transfer_content, true)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  qrContainer: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  bankInfoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
});

export default SepayQRCodeScreen;
