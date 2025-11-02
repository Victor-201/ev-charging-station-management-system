import React from 'react';
import { Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPasswordSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import useAuth from '../../hooks/useAuth';
import AuthWrapper from './AuthWrapper';
import { theme } from '../../config/theme';

export default function ForgotPassword() {
  const { doForgot, loading, error } = useAuth();

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    await doForgot(data.email);
  };

  return (
    <AuthWrapper>
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => <AppInput label="Email" value={value} onChangeText={onChange} keyboardType="email-address" error={errors.email?.message} />} />

      <AppButton onPress={handleSubmit(onSubmit)} loading={loading} disabled={!isValid} style={{ marginTop: 16 }}>
        Gửi liên kết đặt lại
      </AppButton>

      {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}
    </AuthWrapper>
  );
}
