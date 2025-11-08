import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, TextInput, RadioButton, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { topupWallet } from '../../store/slices/walletSlice'; // To be added

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
});

const TopupScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.wallet || {});

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer'); // 'bank_transfer' or 'credit_card'

  const handleTopup = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập một số tiền hợp lệ.');
      return;
    }

    const result = await dispatch(topupWallet({
      userId: user.id,
      amount: Number(amount),
      paymentMethod,
    }));

    if (result.type === 'wallet/topup/fulfilled') {
      Alert.alert('Thành công', 'Nạp tiền thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
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
              <RadioButton value="credit_card" />
              <Text style={styles.radioLabel}>Thẻ tín dụng/ghi nợ</Text>
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
        Xác nhận nạp tiền
      </Button>
    </View>
  );
};

export default TopupScreen;

