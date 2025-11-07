import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { vehicleSchema } from '../../utils/validators';
import { updateVehicle, deleteVehicle } from '../../store/slices/vehicleSlice';
import AppInput from '../../components/common/AppInput';
import { theme } from '../../config/theme';

export default function EditVehicleScreen({ navigation, route }) {
  const { vehicleId } = route.params;
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector((state) => state.vehicles);
  const vehicle = vehicles.find(v => v.id === vehicleId);

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
    const result = await dispatch(updateVehicle({ 
      vehicleId,
      vehicleData: data 
    }));

    if (result.type === 'vehicles/updateVehicle/fulfilled') {
      setSuccessMessage('Cập nhật phương tiện thành công!');
      setTimeout(() => navigation.goBack(), 1500);
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
            const result = await dispatch(deleteVehicle(vehicleId));
            if (result.type === 'vehicles/deleteVehicle/fulfilled') {
              navigation.goBack();
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!vehicle) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Không tìm thấy phương tiện.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
          color={theme.colors.error}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 12,
    borderColor: theme.colors.error,
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
  snackbar: {
    backgroundColor: theme.colors.success,
  },
});
