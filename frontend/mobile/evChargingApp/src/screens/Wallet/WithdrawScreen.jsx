import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Title, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { withdrawFromWallet } from '../../store/slices/walletSlice'; // To be added
import { theme } from '../../config/theme';

const withdrawSchema = yup.object().shape({
  amount: yup.number().required('Vui lòng nhập số tiền').positive('Số tiền phải lớn hơn 0'),
  bank_name: yup.string().required('Vui lòng nhập tên ngân hàng'),
  account_number: yup.string().required('Vui lòng nhập số tài khoản'),
  account_holder: yup.string().required('Vui lòng nhập tên chủ tài khoản'),
});

const WithdrawScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.wallet);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(withdrawSchema),
    mode: 'onChange',
  });

  const handleWithdraw = async (data) => {
    const result = await dispatch(withdrawFromWallet({ userId: user.id, ...data }));

    if (result.type === 'wallet/withdraw/fulfilled') {
      Alert.alert('Thành công', 'Yêu cầu rút tiền đã được gửi đi.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Rút tiền</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Số tiền cần rút" mode="outlined" keyboardType="numeric" {...{ onChange, onBlur, value }} error={!!errors.amount} />
            )}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}

          <Controller
            control={control}
            name="bank_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Tên ngân hàng" mode="outlined" {...{ onChange, onBlur, value }} error={!!errors.bank_name} />
            )}
          />
          {errors.bank_name && <Text style={styles.errorText}>{errors.bank_name.message}</Text>}

          <Controller
            control={control}
            name="account_number"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Số tài khoản" mode="outlined" keyboardType="numeric" {...{ onChange, onBlur, value }} error={!!errors.account_number} />
            )}
          />
          {errors.account_number && <Text style={styles.errorText}>{errors.account_number.message}</Text>}

          <Controller
            control={control}
            name="account_holder"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Tên chủ tài khoản" mode="outlined" {...{ onChange, onBlur, value }} error={!!errors.account_holder} />
            )}
          />
          {errors.account_holder && <Text style={styles.errorText}>{errors.account_holder.message}</Text>}

        </Card.Content>
      </Card>

      {error && <Text style={styles.apiErrorText}>{error}</Text>}

      <Button 
        mode="contained" 
        onPress={handleSubmit(handleWithdraw)}
        loading={loading}
        disabled={!isValid || loading}
        style={styles.button}
      >
        Gửi yêu cầu
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  card: { marginBottom: 24 },
  errorText: { color: theme.colors.error, marginTop: 4 },
  apiErrorText: { color: theme.colors.error, textAlign: 'center', marginBottom: 16 },
  button: { paddingVertical: 8 },
});

export default WithdrawScreen;

