import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import AuthWrapper from './AuthWrapper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, setIsNewUser } from '../../store/slices/authSlice';
import profileService from '../../services/profileService';
import logger from '../../utils/logger';

// Validation schema for profile completion
const profileSchema = yup.object().shape({
  full_name: yup
    .string()
    .required('Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự'),
  phone: yup
    .string()
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')
    .nullable(),
  date_of_birth: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày sinh không hợp lệ (YYYY-MM-DD)')
    .nullable(),
});

export default function CompleteProfile() {
  const styles = getStyles();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      date_of_birth: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      logger.info('Completing profile for user:', user?.user_id);

      // Prepare profile data (remove empty fields)
      const profileData = {};
      if (data.full_name) profileData.full_name = data.full_name;
      if (data.phone) profileData.phone = data.phone;
      if (data.date_of_birth) profileData.date_of_birth = data.date_of_birth;

      // Update profile
      await profileService.updateProfile(user?.user_id, profileData);

      // Refresh user profile
      dispatch(fetchUserProfile());

      // Mark user as no longer new
      dispatch(setIsNewUser(false));

      Alert.alert('Thành công', 'Hồ sơ của bạn đã được cập nhật!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will be handled by RootNavigator
            logger.info('Profile completed, navigating to main app');
          },
        },
      ]);
    } catch (error) {
      logger.error('Error completing profile:', error);

      // Better error handling
      let errorMessage = 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Bỏ qua',
      'Bạn có thể hoàn thiện hồ sơ sau trong phần Cài đặt.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ qua',
          onPress: () => {
            logger.info('User skipped profile completion');
            // Mark user as no longer new
            dispatch(setIsNewUser(false));
            // Navigation will be handled by RootNavigator
          },
        },
      ]
    );
  };

  return (
    <AuthWrapper title="Hoàn thiện hồ sơ" subtitle="Vui lòng cung cấp thông tin cơ bản">
      <ScrollView showsVerticalScrollIndicator={false}>
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
              placeholder="Nguyễn Văn A"
              style={styles.input}
            />
          )}
        />

        {/* Phone Input */}
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
              placeholder="0912345678"
              style={styles.input}
            />
          )}
        />

        {/* Date of Birth Input */}
        <Controller
          control={control}
          name="date_of_birth"
          render={({ field: { onChange, value } }) => (
            <View>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <AppInput
                  label="Ngày sinh"
                  value={value}
                  error={errors.date_of_birth?.message}
                  placeholder="YYYY-MM-DD (VD: 1990-01-15)"
                  style={styles.input}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      const formattedDate = selectedDate.toISOString().split('T')[0];
                      onChange(formattedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
          )}
        />

        {/* Submit Button */}
        <AppButton
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isValid || loading}
          style={styles.submitButton}
        >
          Hoàn tất
        </AppButton>

        {/* Skip Button */}
        <AppButton
          mode="text"
          onPress={handleSkip}
          disabled={loading}
          style={styles.skipButton}
        >
          Bỏ qua
        </AppButton>
      </ScrollView>
    </AuthWrapper>
  );
}

const getStyles = () => StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  skipButton: {
    marginBottom: 16,
  },
});

