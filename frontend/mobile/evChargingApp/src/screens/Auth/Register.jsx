import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Snackbar, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  dateInputContainer: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.onSurface + '20',
  },
  dateButtonError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.onSurface,
  },
  dateButtonPlaceholder: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.onSurface + '80',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
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
  requiredFieldsNote: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});

export default function Register({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { doRegister, loading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Handle date picker change
    const handleDateChange = (_, date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS

    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      setValue('date_of_birth', formattedDate, { shouldValidate: true });
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const onSubmit = async (data) => {
    try {
      const result = await doRegister({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        password: data.password,
        password_confirmation: data.confirmPassword
      });

      // Check if registration was successful by inspecting the payload
      if (result.type === 'auth/register/fulfilled' && result.payload) {
        // Use the message from the backend if available
        const message = result.payload.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.';
        setSuccessMessage(message);

        // Navigate to verify email screen if required by the backend
        if (result.payload.verification_required) {
          setTimeout(() => {
            navigation.navigate('VerifyEmail', { email: data.email });
          }, 2000);
        }
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
        <Text style={styles.requiredFieldsNote}>* Trường bắt buộc</Text>

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
          name="phone"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput
              label="Số điện thoại"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              error={errors.phone?.message}
              placeholder="0123456789"
              style={styles.input}
            />
          )}
        />

        {/* Date of Birth Picker */}
        <Controller
          control={control}
          name="date_of_birth"
          render={({ field: { value } }) => (
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Ngày sinh *</Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  errors.date_of_birth && styles.dateButtonError
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={value ? styles.dateButtonText : styles.dateButtonPlaceholder}>
                  {value ? formatDateDisplay(value) : 'Chọn ngày sinh (phải đủ 18 tuổi)'}
                </Text>
                <IconButton icon="calendar" size={20} />
              </TouchableOpacity>
              {errors.date_of_birth && (
                <Text style={styles.dateErrorText}>{errors.date_of_birth.message}</Text>
              )}
            </View>
          )}
        />

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}

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


