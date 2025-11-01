// src/screens/Auth/Login.jsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
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

export default function Login() {
  const navigation = useNavigation();
  const { doLogin, loading, error } = useAuth();
  const [rememberChecked, setRememberChecked] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm({ resolver: yupResolver(loginSchema), mode: 'onChange', defaultValues: { email: '', password: '' } });

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={{ width: '100%' }}>
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

        <View style={styles.row}>
          <TouchableOpacity onPress={() => setRememberChecked((p) => !p)} style={styles.remember}>
            <Text>{rememberChecked ? '☑' : '☐'} Ghi nhớ</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ color: '#1e88e5' }}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <AppButton onPress={handleSubmit(onSubmit)} loading={loading} disabled={!isValid} style={{ marginTop: 16 }}>
          Đăng nhập
        </AppButton>

        {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <OAuthButtons onSuccess={() => {}} onError={(e) => console.log(e)} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'center' }}>
          <Text>Bạn chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginLeft: 8 }}>
            <Text style={{ color: '#1e88e5' }}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8 },
  remember: { flexDirection: 'row', alignItems: 'center' },
});
