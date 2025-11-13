import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import { changePasswordSchema } from '../../utils/validators';
import profileService from '../../services/profileService';
import AppInput from '../../components/common/AppInput';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 4,
    backgroundColor: colors.primary,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
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
  snackbar: {
    backgroundColor: colors.success,
  },
});

export default function ChangePasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { profile } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isDirty } 
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: { current_password: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setErrorMessage('');

      await profileService.changePassword(profile.id, {
        current_password: data.current_password,
        new_password: data.password,
      });

      setSuccessMessage('Đổi mật khẩu thành công!');
      setTimeout(() => navigation.goBack(), 1500);

    } catch (error) {
      const message = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.contentContainer}>
        {/* Current Password Input */}
        <Controller 
          control={control} 
          name="current_password" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput 
              label="Mật khẩu hiện tại *" 
              value={value} 
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry 
              error={errors.current_password?.message}
              style={styles.input}
            />
          )} 
        />

        {/* New Password Input */}
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
              style={styles.input}
            />
          )} 
        />

        {/* Confirm New Password Input */}
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
              style={styles.input}
            />
          )} 
        />

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Submit Button */}
        <Button 
          mode="contained"
          onPress={handleSubmit(onSubmit)} 
          loading={loading} 
          disabled={!isValid || !isDirty || loading}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
        >
          Lưu thay đổi
        </Button>
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
      </ScrollView>
    </SafeAreaView>
  );
}


