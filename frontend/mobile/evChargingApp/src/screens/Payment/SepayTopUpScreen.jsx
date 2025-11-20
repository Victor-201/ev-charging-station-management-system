/**
 * Sepay Top-Up Screen
 * Allows users to top up their wallet via bank transfer
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import sepayService from '../../services/sepayService';
import { logger } from '../../utils/logger';

const SepayTopUpScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Get user from profile
  const profile = useSelector(state => state.user?.profile);
  const userId = profile?.user_id || profile?.id;

  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedAmounts = sepayService.getPredefinedAmounts();

  /**
   * Handle amount selection
   */
  const handleAmountSelect = selectedAmount => {
    setAmount(selectedAmount);
    setCustomAmount('');
    setError('');
  };

  /**
   * Handle custom amount input
   */
  const handleCustomAmountChange = text => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setAmount(numericValue ? parseInt(numericValue) : '');
    setError('');
  };

  /**
   * Handle continue to payment
   */
  const handleContinue = async () => {
    try {
      // Validate amount
      const finalAmount = amount || parseInt(customAmount);
      const validation = sepayService.validateAmount(finalAmount);

      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Check if user is logged in
      if (!userId) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để nạp tiền');
        return;
      }

      setLoading(true);
      setError('');

      // Create top-up request with userId
      const transaction = await sepayService.createTopUpRequest(
        finalAmount,
        userId,
      );

      // Navigate to QR code screen with transaction data
      navigation.navigate('SepayQRCode', {
        transaction,
        amount: finalAmount,
      });
    } catch (err) {
      logger.error('Failed to create top-up request', err);
      Alert.alert(
        'Lỗi',
        err.response?.data?.message ||
          'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render predefined amount button
   */
  const renderAmountButton = value => {
    const isSelected = amount === value;

    return (
      <TouchableOpacity
        key={value}
        style={[styles.amountButton, isSelected && styles.amountButtonSelected]}
        onPress={() => handleAmountSelect(value)}
      >
        <Text
          style={[styles.amountText, isSelected && styles.amountTextSelected]}
        >
          {sepayService.formatAmount(value)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with SafeArea */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nạp tiền qua Sepay</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Nạp tiền vào ví qua chuyển khoản ngân hàng. Tiền sẽ được cập nhật tự
            động sau khi chuyển khoản thành công.
          </Text>
        </View>

        {/* Predefined Amounts */}
        <Text style={styles.sectionTitle}>Chọn số tiền</Text>
        <View style={styles.amountGrid}>
          {predefinedAmounts.map(renderAmountButton)}
        </View>

        {/* Custom Amount */}
        <Text style={styles.sectionTitle}>Hoặc nhập số tiền khác</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tiền"
            keyboardType="numeric"
            value={customAmount}
            onChangeText={handleCustomAmountChange}
          />
          <Text style={styles.inputSuffix}>VND</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Fee Info */}
        <View style={styles.feeInfo}>
          <Text style={styles.feeLabel}>Phí giao dịch:</Text>
          <Text style={styles.feeValue}>Miễn phí</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !amount && !customAmount && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading || (!amount && !customAmount)}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.continueButtonText}>Tiếp tục</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  amountButton: {
    width: '30%',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  amountTextSelected: {
    color: '#FFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  inputSuffix: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  feeLabel: {
    fontSize: 14,
    color: '#757575',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  continueButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default SepayTopUpScreen;
