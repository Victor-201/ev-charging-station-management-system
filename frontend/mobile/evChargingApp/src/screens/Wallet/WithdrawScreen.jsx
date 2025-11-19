import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { withdrawFromWallet } from '../../store/slices/walletSlice'; // To be added
import AppInput from '../../components/common/AppInput';

const withdrawSchema = yup.object().shape({
  amount: yup.number().required('Vui lòng nhập số tiền').positive('Số tiền phải lớn hơn 0'),
  bank_name: yup.string().required('Vui lòng nhập tên ngân hàng'),
  account_number: yup.string().required('Vui lòng nhập số tài khoản'),
  account_holder: yup.string().required('Vui lòng nhập tên chủ tài khoản'),
});

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: colors.onSurface },
  input: { marginBottom: 16 },
  apiErrorText: { color: colors.error, textAlign: 'center', marginBottom: 16 },
  button: { paddingVertical: 8, marginTop: 16 },
});

const WithdrawScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.wallet || {});

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(withdrawSchema),
    mode: 'onChange',
    defaultValues: { amount: '', bank_name: '', account_number: '', account_holder: '' },
  });

  const handleWithdraw = async (data) => {
    // TODO: Backend withdraw endpoint not yet implemented
    Alert.alert(
      'Chức năng đang phát triển',
      'Tính năng rút tiền đang được phát triển. Vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp.',
      [{ text: 'Đã hiểu' }]
    );
    
    // Uncomment when backend endpoint is ready:
    // const userId = user?.user_id || user?.id;
    // const result = await dispatch(withdrawFromWallet({ userId, ...data }));
    // if (result.type === 'wallet/withdraw/fulfilled') {
    //   Alert.alert('Thành công', 'Yêu cầu rút tiền đã được gửi đi.', [
    //     { text: 'OK', onPress: () => navigation.goBack() },
    //   ]);
    // }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.contentContainer}>
        <Text style={styles.title}>Rút tiền</Text>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Số tiền cần rút" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.amount?.message} keyboardType="numeric" style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="bank_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Tên ngân hàng" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bank_name?.message} style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="account_number"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Số tài khoản" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.account_number?.message} keyboardType="numeric" style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="account_holder"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Tên chủ tài khoản" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.account_holder?.message} style={styles.input} />
          )}
        />

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default WithdrawScreen;

