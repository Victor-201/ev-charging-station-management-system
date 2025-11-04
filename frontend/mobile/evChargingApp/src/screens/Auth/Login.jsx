import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import OAuthButtons from '../../components/social/OAuthButtons';
import useAuth from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';
import { useNavigation } from '@react-navigation/native';
import AuthWrapper from './AuthWrapper';
import { theme } from '../../config/theme';

export default function Login() {
  const navigation = useNavigation();
  const { doLogin, loading, error } = useAuth();
  const [rememberChecked, setRememberChecked] = useState(true);

  const { control, handleSubmit, formState: { errors, isValid }, setValue } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    (async () => {
      const remembered = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
      if (remembered) setValue('email', remembered);
    })();
  }, [setValue]);

  const onSubmit = async (data) => {
    await doLogin({ email: data.email, password: data.password, remember: rememberChecked });
  };

  return (
    <AuthWrapper>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <AppInput label="Email" value={value} onChangeText={onChange} keyboardType="email-address" error={errors.email?.message} />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <AppInput label="Mật khẩu" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
        )}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <TouchableOpacity onPress={() => setRememberChecked(p => !p)}>
          <Text style={{ color: theme.colors.onSurface }}>{rememberChecked ? '☑' : '☐'} Ghi nhớ</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={{ color: theme.colors.primary }}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      <AppButton onPress={handleSubmit(onSubmit)} loading={loading} disabled={!isValid} style={{ marginTop: 16 }}>
        Đăng nhập
      </AppButton>

      {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}

      <OAuthButtons 
        mode='login' 
        onSuccess={(data) => {
          console.log('OAuth login successful:', data);
        }} 
        onError={(error) => {
          console.error('OAuth login error:', error);
        }} 
      />

      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.onSurface }}>Bạn chưa có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginLeft: 8 }}>
          <Text style={{ color: theme.colors.primary }}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </AuthWrapper>
  );
}
