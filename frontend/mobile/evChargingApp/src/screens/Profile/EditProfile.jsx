import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Title, Button, Snackbar, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileSchema } from '../../utils/validators';
import { updateProfile, getMe } from '../../store/slices/userSlice';
import AppInput from '../../components/common/AppInput';
import { useTheme } from 'react-native-paper';
// import { launchImageLibrary } from 'react-native-image-picker'; // To be added later

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 15,
  },
  emailText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.onSurface + '80',
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

export default function EditProfile({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(updateProfileSchema),
    mode: 'onChange',
  });

  // Pre-fill form with user data when profile is loaded
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
      });
    }
  }, [profile, reset]);

  const handleAvatarChange = () => {
    // TODO: Implement image picker logic
    // const options = { mediaType: 'photo', quality: 0.5 };
    // launchImageLibrary(options, (response) => { ... });
    Alert.alert('Tính năng sắp ra mắt', 'Chức năng thay đổi ảnh đại diện sẽ được cập nhật sớm.');
  };

  const onSubmit = async (data) => {
    if (!profile?.id) return;

    const result = await dispatch(updateProfile({
      userId: profile.id,
      profileData: data
    }));

    if (result.type === 'user/updateProfile/fulfilled') {
      setSuccessMessage('Cập nhật thông tin thành công!');
      dispatch(getMe()); // Refetch profile to get updated data
      setTimeout(() => navigation.goBack(), 1500);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
      <View style={styles.contentContainer}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAvatarChange}>
            <Avatar.Image
              size={100}
              source={{ uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}` }}
            />
            <View style={styles.avatarEditIcon}>
              <Avatar.Icon size={30} icon="camera" color={colors.primary} />
            </View>
          </TouchableOpacity>
          <Title style={styles.emailText}>{profile?.email}</Title>
        </View>

        {/* Form Inputs */}
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
              autoCapitalize="words"
              style={styles.input}
            />
          )}
        />

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
              style={styles.input}
            />
          )}
        />

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!isDirty || !isValid || loading}
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

