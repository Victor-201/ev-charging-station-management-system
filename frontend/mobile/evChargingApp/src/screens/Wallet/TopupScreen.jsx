import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, TextInput, RadioButton, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { topupWallet } from '../../store/slices/walletSlice';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: colors.onSurface,
  },
  card: {
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  input: {
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.onSurface,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    color: colors.onSurface,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 8,
  },
  referenceContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  referenceCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  referenceInstruction: {
    textAlign: 'center',
    opacity: 0.8,
  },
});

const TopupScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.wallet || {});

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [topupResult, setTopupResult] = useState(null);

  const handleTopup = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập một số tiền hợp lệ.');
      return;
    }

    const result = await dispatch(topupWallet({
      user_id: user.id,
      amount: Number(amount),
      method: paymentMethod,
    }));

    if (result.type === 'wallet/topup/fulfilled') {
      setTopupResult(result.payload);
    }
  };

  if (topupResult) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Card style={styles.referenceContainer}>
          <Card.Content>
            <Text style={styles.referenceTitle}>Hoàn tất nạp tiền</Text>
            <Text style={styles.referenceInstruction}>Vui lòng chuyển khoản với nội dung sau:</Text>
            <Text style={styles.referenceCode}>{topupResult.reference_code}</Text>
            <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
              Đã hiểu
            </Button>
          </Card.Content>
        </Card>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Nạp tiền vào ví</Text>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Số tiền (VND)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.methodTitle}>Chọn phương thức thanh toán:</Text>
          <RadioButton.Group onValueChange={newValue => setPaymentMethod(newValue)} value={paymentMethod}>
            <View style={styles.radioItem}>
              <RadioButton value="bank_transfer" />
              <Text style={styles.radioLabel}>Chuyển khoản ngân hàng</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="credit_card" disabled />
              <Text style={[styles.radioLabel, { opacity: 0.5 }]}>Thẻ tín dụng/ghi nợ (sắp có)</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        mode="contained"
        onPress={handleTopup}
        loading={loading}
        disabled={loading || !amount}
        style={styles.button}
      >
        Lấy mã nạp tiền
      </Button>
    </SafeAreaView>
  );
};

export default TopupScreen;

