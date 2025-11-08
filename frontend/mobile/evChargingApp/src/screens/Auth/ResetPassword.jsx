import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Snackbar } from 'react-native-paper';
import { resetPasswordSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import AuthWrapper from './AuthWrapper';
import { useTheme } from 'react-native-paper';
import authService from '../../services/authService';

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

export default function ResetPassword({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  // The reset token would typically come from a deep link
  const { token } = route.params || {}; 
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isDirty } 
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' }
  });

  useEffect(() => {
    if (!token) {
      setErrorMessage('Không tìm thấy mã đặt lại mật khẩu. Vui lòng thử lại từ email của bạn.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) return;

    try {
      setLoading(true);
      setErrorMessage('');
      
      await authService.resetPassword({ 
        token,
        password: data.password 
      });

      setSuccessMessage('Mật khẩu đã được đặt lại thành công!');
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);

    } catch (error) {
      const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper title="Đặt Lại Mật Khẩu">
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Vui lòng nhập mật khẩu mới của bạn. Mật khẩu phải chứa ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.
        </Text>

        {/* Password Input */}
        <Controller 
          control={control} 
          name="password" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput 
              label="Mật khẩu mới *" 
              value={value} 
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry 
              error={errors.password?.message}
              placeholder="Nhập mật khẩu mới"
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
              label="Xác nhận mật khẩu mới *" 
              value={value} 
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry 
              error={errors.confirmPassword?.message}
              placeholder="Nhập lại mật khẩu mới"
              style={styles.input}
            />
          )} 
        />

        {/* Submit Button */}
        <AppButton 
          onPress={handleSubmit(onSubmit)} 
          loading={loading} 
          disabled={!isValid || !isDirty || loading || !token}
          style={styles.submitButton}
        >
          Đặt lại mật khẩu
        </AppButton>

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
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
        duration={2000}
        style={styles.snackbar}
      >
        {successMessage}
      </Snackbar>
    </AuthWrapper>
  );
}


