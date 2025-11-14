import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Snackbar } from 'react-native-paper';
import { verifyEmailSchema } from '../../utils/validators';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import AuthWrapper from './AuthWrapper';
import { useTheme } from 'react-native-paper';
import authService from '../../services/authService';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: colors.brand50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  subInfoText: {
    fontSize: 13,
    color: colors.onSurface + '80',
  },
  input: {
    marginBottom: 16,
  },
  verifyButton: {
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: colors.onSurface,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: colors.onSurface + '40',
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

export default function VerifyEmail({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const countdownRef = useRef(null);





  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(verifyEmailSchema),
    mode: 'onChange',
    defaultValues: {
      token: ''
    }
  });

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');

      await authService.verifyEmail(data.token);

      setSuccessMessage('Xác thực email thành công!');

      // Navigate to login after 1.5 seconds
      setTimeout(() => {
        navigation.navigate('Login', { email });
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.message || 'Xác thực thất bại. Vui lòng kiểm tra lại token xác thực.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    try {
      setResending(true);
      setErrorMessage('');

      await authService.resendVerificationCode({ email });

      setSuccessMessage('Mã xác thực đã được gửi lại!');
      startCountdown();
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.';
      setErrorMessage(message);
    } finally {
      setResending(false);
    }
  };



  return (
    <AuthWrapper title="Xác Thực Email">
      <View style={styles.container}>
        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Chúng tôi đã gửi link xác thực đến email:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.subInfoText}>
            Vui lòng kiểm tra hộp thư, click vào link hoặc copy token từ email và nhập bên dưới.
          </Text>
        </View>

        {/* Verification Token Input */}
        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Token xác thực *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.token?.message}
              placeholder="Nhập token từ email"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />

        {/* Verify Button */}
        <AppButton
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isValid || loading}
          style={styles.verifyButton}
        >
          Xác thực
        </AppButton>

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Không nhận được mã? </Text>
          <Text
            style={[
              styles.resendLink,
              (countdown > 0 || resending) && styles.resendLinkDisabled
            ]}
            onPress={handleResendCode}
            disabled={countdown > 0 || resending}
          >
            {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại'}
          </Text>
        </View>

        {/* Back to Login */}
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
        duration={1500}
        style={styles.snackbar}
      >
        {successMessage}
      </Snackbar>
    </AuthWrapper>
  );
}



