import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Title, TextInput, RadioButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { topupWallet } from '../../store/slices/walletSlice'; // To be added
import { theme } from '../../config/theme';

const TopupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.wallet);

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
      <Title style={styles.title}>Nạp tiền vào ví</Title>

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
              <Text>Chuyển khoản ngân hàng</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="credit_card" />
              <Text>Thẻ tín dụng/ghi nợ</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button 
        mode="contained" 
        onPress={handleTopup}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Xác nhận nạp tiền
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 8,
  },
});

export default TopupScreen;

