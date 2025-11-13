import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Snackbar } from 'react-native-paper';
import { registerSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import useAuth from '../../hooks/useAuth';
import AuthWrapper from './AuthWrapper';
import OAuthButtons from '../../components/social/OAuthButtons';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.onSurface + '20',
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.onSurface + '60',
    fontSize: 14,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: colors.onSurface,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  snackbar: {
    backgroundColor: colors.success,
  },
});

export default function Register({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { doRegister, loading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty }
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      date_of_birth: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const result = await doRegister({
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        password: data.password,
        password_confirmation: data.confirmPassword
      });

      // Check if registration was successful
      if (result.type === 'auth/register/fulfilled') {
        setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');

        // Navigate to verify email screen after 2 seconds
        setTimeout(() => {
          navigation.navigate('VerifyEmail', { email: data.email });
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <AuthWrapper title="Tạo Tài Khoản">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Full Name Input */}
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Họ và tên *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.full_name?.message}
              placeholder="Nhập họ và tên của bạn"
              autoCapitalize="words"
              style={styles.input}
            />
          )}
        />

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Email *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              error={errors.email?.message}
              placeholder="example@email.com"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />

        {/* Phone Number Input */}
        <Controller
          control={control}
          name="phone_number"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Số điện thoại"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              error={errors.phone_number?.message}
              placeholder="0123456789"
              style={styles.input}
            />
          )}
        />

        {/* Date of Birth Input */}
        <Controller
          control={control}
          name="date_of_birth"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Ngày sinh *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.date_of_birth?.message}
              placeholder="YYYY-MM-DD (ví dụ: 2000-01-15)"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Mật khẩu *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.password?.message}
              placeholder="Tối thiểu 6 ký tự"
              style={styles.input}
            />
          )}
        />

        {/* Confirm Password Input */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Xác nhận mật khẩu *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.confirmPassword?.message}
              placeholder="Nhập lại mật khẩu"
              style={styles.input}
            />
          )}
        />

        {/* Register Button */}
        <AppButton
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isValid || !isDirty || loading}
          style={styles.registerButton}
        >
          Đăng ký
        </AppButton>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Register */}
        <OAuthButtons
          mode='register'
          onSuccess={() => navigation.navigate('Home')}
          onError={(err) => {
            Alert.alert('Lỗi', err.message || 'Đăng ký thất bại');
          }}
        />

        {/* Link to Login */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>Bạn đã có tài khoản? </Text>
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            Đăng nhập
          </Text>
        </View>
      </ScrollView>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage('')}
        duration={2000}
        style={styles.snackbar}
      >
        {successMessage}
      </Snackbar>
    </AuthWrapper>
  );
}


