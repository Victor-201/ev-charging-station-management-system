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
import { theme } from '../../config/theme';

export default function ForgotPassword({ navigation }) {
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
      setSuccessMessage('Yêu cầu đã được gửi! Vui lòng kiểm tra email của bạn.');
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurface + '90',
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
    backgroundColor: theme.colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  snackbar: {
    backgroundColor: theme.colors.success,
  },
});
