import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Snackbar } from 'react-native-paper';
import { forgotPasswordSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import useAuth from '../../hooks/useAuth';
import AuthWrapper from './AuthWrapper';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.onSurface + '90',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
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
  loginLinkContainer: {
    marginTop: 32,
    alignItems: 'center',
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

export default function ForgotPassword({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { doForgot, loading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty }
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    const result = await doForgot(data.email);
    if (result.type === 'auth/forgotPassword/fulfilled') {
      setSuccessMessage('Yêu cầu đã được gửi! Đang chuyển hướng...');
      // In a real app, the user would get a link via email.
      // For development, we'll navigate directly to the reset screen.
      setTimeout(() => {
        navigation.navigate('ResetPassword', { token: 'mock-reset-token-123' });
      }, 1500);
    }
  };

  return (
    <AuthWrapper title="Quên Mật Khẩu">
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
        </Text>

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Email"
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

        {/* Submit Button */}
        <AppButton
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isValid || !isDirty || loading}
          style={styles.submitButton}
        >
          Gửi yêu cầu
        </AppButton>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Back to Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            ← Quay lại đăng nhập
          </Text>
        </View>
      </View>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage('')}
        duration={3000} // Show for 3 seconds
        style={styles.snackbar}
      >
        {successMessage}
      </Snackbar>
    </AuthWrapper>
  );
}


