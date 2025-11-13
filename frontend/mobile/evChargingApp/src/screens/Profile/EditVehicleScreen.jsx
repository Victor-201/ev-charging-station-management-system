import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTheme } from 'react-native-paper';
import { vehicleSchema } from '../../utils/validators';
import useVehicles from '../../hooks/useVehicles';
import AppInput from '../../components/common/AppInput';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteButton: {
    marginTop: 12,
    borderColor: colors.error,
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

export default function EditVehicleScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { vehicleId } = route.params;

  const {
    loading,
    error,
    modifyVehicle,
    removeVehicle,
    getVehicleById
  } = useVehicles();

  const vehicle = getVehicleById(vehicleId);
  const [successMessage, setSuccessMessage] = useState('');

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(vehicleSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        license_plate: vehicle.license_plate,
        battery_capacity: vehicle.battery_capacity.toString(),
        connector_type: vehicle.connector_type,
      });
    }
  }, [vehicle, reset]);

  const onUpdate = async (data) => {
    try {
      await modifyVehicle(vehicleId, data);
      setSuccessMessage('Cập nhật phương tiện thành công!');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      // Error is already handled by Redux state
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Xóa phương tiện',
      'Bạn có chắc chắn muốn xóa phương tiện này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              await removeVehicle(vehicleId);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete vehicle:', err);
              Alert.alert('Lỗi', 'Không thể xóa phương tiện. Vui lòng thử lại.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <Text>Không tìm thấy phương tiện.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
      <View style={styles.contentContainer}>
        <Controller 
          control={control} name="make" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Hãng xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.make?.message} style={styles.input} />
          )} 
        />
        <Controller 
          control={control} name="model" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Mẫu xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.model?.message} style={styles.input} />
          )} 
        />
        <Controller 
          control={control} name="year" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Năm sản xuất *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.year?.message} keyboardType="numeric" style={styles.input} />
          )} 
        />
        <Controller 
          control={control} name="license_plate" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Biển số xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.license_plate?.message} autoCapitalize="characters" style={styles.input} />
          )} 
        />
        <Controller 
          control={control} name="battery_capacity" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Dung lượng pin (kWh) *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.battery_capacity?.message} keyboardType="numeric" style={styles.input} />
          )} 
        />
        <Controller 
          control={control} name="connector_type" 
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Loại cổng sạc *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.connector_type?.message} style={styles.input} />
          )} 
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button 
          mode="contained"
          onPress={handleSubmit(onUpdate)} 
          loading={loading} 
          disabled={!isDirty || !isValid || loading}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
        >
          Lưu thay đổi
        </Button>

        <Button 
          mode="outlined"
          onPress={onDelete}
          loading={loading}
          disabled={loading}
          color={colors.error}
          style={styles.deleteButton}
        >
          Xóa phương tiện
        </Button>
      </View>

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


