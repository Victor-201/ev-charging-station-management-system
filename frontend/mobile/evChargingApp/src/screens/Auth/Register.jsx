import React from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import useAuth from '../../hooks/useAuth';
import AuthWrapper from './AuthWrapper';
import OAuthButtons from '../../components/social/OAuthButtons';
import { theme } from '../../config/theme';

export default function Register({ navigation }) {
  const { doRegister, loading, error } = useAuth();

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    await doRegister({ fullName: data.fullName, email: data.email, password: data.password });
    navigation.navigate('Login');
  };

  return (
    <AuthWrapper>
      <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => <AppInput label="Họ tên" value={value} onChangeText={onChange} error={errors.fullName?.message} />} />
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => <AppInput label="Email" value={value} onChangeText={onChange} keyboardType="email-address" error={errors.email?.message} />} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => <AppInput label="Mật khẩu" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />} />
      <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => <AppInput label="Xác nhận mật khẩu" value={value} onChangeText={onChange} secureTextEntry error={errors.confirmPassword?.message} />} />

      <AppButton onPress={handleSubmit(onSubmit)} loading={loading} disabled={!isValid} style={{ marginTop: 16 }}>
        Đăng ký
      </AppButton>

      {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}

      {/* Social register */}
      <View style={{ marginTop: 16 }}>
        <OAuthButtons
          mode='register'
          onSuccess={() => navigation.navigate('Home')}
          onError={(e) => console.log(e)}
        />
      </View>

      {/* Link to register */}
      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.onSurface }}>Bạn đã có tài khoản?</Text>
        <Text style={{ color: theme.colors.primary, marginLeft: 8 }} onPress={() => navigation.navigate('Login')}>
          Đăng nhập
        </Text>
      </View>
    </AuthWrapper>
  );
}
