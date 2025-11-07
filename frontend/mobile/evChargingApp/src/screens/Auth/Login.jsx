import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox } from 'react-native-paper';
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
import logger from '../../utils/logger';

export default function Login() {
  const navigation = useNavigation();
  const { doLogin, loading, error } = useAuth();
  const [rememberChecked, setRememberChecked] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' }
  });

  // Load remembered email on component mount
  useEffect(() => {
    const loadRememberedEmail = async () => {
      const rememberedEmail = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
      if (rememberedEmail) {
        setValue('email', rememberedEmail);
      }
    };
    loadRememberedEmail();
  }, [setValue]);

  // RootNavigator handles navigation based on the authentication state.
  // The useEffect that was here caused a race condition.

  const onSubmit = async (data) => {
    await doLogin({
      email: data.email,
      password: data.password,
      remember: rememberChecked
    });
  };

  return (
    <AuthWrapper title="Đăng Nhập">
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

      {/* Password Input */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <AppInput
            label="Mật khẩu"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            error={errors.password?.message}
            placeholder="Nhập mật khẩu của bạn"
            style={styles.input}
          />
        )}
      />

      {/* Options: Remember me & Forgot Password */}
      <View style={styles.optionsContainer}>
        <Checkbox.Item
          label="Ghi nhớ"
          status={rememberChecked ? 'checked' : 'unchecked'}
          onPress={() => setRememberChecked(!rememberChecked)}
          position="leading"
          style={styles.checkboxContainer}
          labelStyle={styles.checkboxLabel}
        />
        <Text
          style={styles.forgotPasswordLink}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          Quên mật khẩu?
        </Text>
      </View>

      {/* Login Button */}
      <AppButton
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={!isValid || !isDirty || loading}
        style={styles.loginButton}
      >
        Đăng nhập
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
        <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
        <View style={styles.divider} />
      </View>

      {/* Social Login */}
      <OAuthButtons
        mode='login'
        onSuccess={() => {
          // Navigation is now handled by RootNavigator based on auth state.
          logger.info('Social login successful, RootNavigator will handle the redirect.');
        }}
        onError={(err) => {
          Alert.alert('Lỗi', err.message || 'Đăng nhập thất bại');
        }}
      />

      {/* Link to Register */}
      <View style={styles.registerLinkContainer}>
        <Text style={styles.registerLinkText}>Bạn chưa có tài khoản? </Text>
        <Text
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          Đăng ký
        </Text>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8, // Adjust for checkbox padding
    marginBottom: 8,
  },
  checkboxContainer: {
    paddingHorizontal: 0,
    marginLeft: -10, // Adjust for checkbox padding
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  forgotPasswordLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.onSurface + '20',
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.onSurface + '60',
    fontSize: 14,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLinkText: {
    color: theme.colors.onSurface,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
