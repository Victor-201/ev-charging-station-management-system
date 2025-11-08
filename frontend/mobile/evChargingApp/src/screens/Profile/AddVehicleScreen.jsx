import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { vehicleSchema } from '../../utils/validators';
import { addVehicle, updateVehicle } from '../../store/slices/vehicleSlice';
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

export default function AddVehicleScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { vehicles, loading, error } = useSelector((state) => state.vehicles);
  const { vehicleId } = route.params || {};
  const isEditMode = !!vehicleId;
  const vehicleToEdit = isEditMode ? vehicles.find(v => v.id === vehicleId) : null;
  const [successMessage, setSuccessMessage] = useState('');

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isDirty } 
  } = useForm({
    resolver: yupResolver(vehicleSchema),
    mode: 'onChange',
    defaultValues: {
      make: vehicleToEdit?.make || '',
      model: vehicleToEdit?.model || '',
      year: vehicleToEdit?.year?.toString() || '',
      license_plate: vehicleToEdit?.license_plate || '',
      battery_capacity: vehicleToEdit?.battery_capacity?.toString() || '',
      connector_type: vehicleToEdit?.connector_type || '',
    }
  });

  const onSubmit = async (data) => {
    if (!user?.id) return;

    if (isEditMode) {
      const result = await dispatch(updateVehicle({
        vehicleId: vehicleId,
        vehicleData: data
      }));
      if (result.type === 'vehicles/updateVehicle/fulfilled') {
        setSuccessMessage('Cập nhật phương tiện thành công!');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } else {
      const result = await dispatch(addVehicle({
        userId: user.id,
        vehicleData: data
      }));
      if (result.type === 'vehicles/addVehicle/fulfilled') {
        setSuccessMessage('Thêm phương tiện thành công!');
        setTimeout(() => navigation.goBack(), 1500);
      }
    }
  };

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
          onPress={handleSubmit(onSubmit)} 
          loading={loading} 
          disabled={!isValid || !isDirty || loading}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
        >
          {isEditMode ? 'Lưu thay đổi' : 'Thêm phương tiện'}
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


