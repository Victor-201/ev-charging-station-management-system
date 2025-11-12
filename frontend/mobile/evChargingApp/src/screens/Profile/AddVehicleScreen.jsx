import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTheme } from 'react-native-paper';
import { vehicleSchema } from '../../utils/validators';
import useVehicles from '../../hooks/useVehicles';
import AppInput from '../../components/common/AppInput';
import vehicleService from '../../services/vehicleService';

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
    marginTop: 24,
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
  lookupContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lookupInput: {
    flex: 1,
  },
  lookupButton: {
    marginLeft: 8,
    marginTop: 8,
  },
  specsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  specsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});

export default function AddVehicleScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { createVehicle, modifyVehicle, getVehicleById, loading, error } = useVehicles();
  const { vehicleId } = route.params || {};
  const isEditMode = !!vehicleId;
  const vehicleToEdit = isEditMode ? getVehicleById(vehicleId) : null;

  const [successMessage, setSuccessMessage] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [vehicleSpecs, setVehicleSpecs] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(vehicleSchema),
    mode: 'onChange',
    defaultValues: {
      brand: vehicleToEdit?.brand || '',
      model: vehicleToEdit?.model || '',
      year: vehicleToEdit?.year?.toString() || '',
      plate_number: vehicleToEdit?.plate_number || '',
    },
  });

  const brandValue = watch('brand');
  const modelValue = watch('model');

  const handleLookup = async () => {
    if (!brandValue || !modelValue) {
      setLookupError('Please enter both make and model.');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setVehicleSpecs(null);
    try {
      const { data } = await vehicleService.lookupVehicle(brandValue, modelValue);
      if (Object.keys(data).length > 0) {
        setVehicleSpecs(data);
      } else {
        setLookupError('Vehicle not found. Please check make and model.');
      }
    } catch (err) {
      setLookupError('Failed to fetch vehicle data. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const finalVehicleData = {
        ...data,
        ...vehicleSpecs,
      };

      if (isEditMode) {
        await modifyVehicle(vehicleId, data);
        setSuccessMessage('Cập nhật phương tiện thành công!');
      } else {
        await createVehicle(finalVehicleData);
        setSuccessMessage('Thêm phương tiện thành công!');
      }
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      console.error('Failed to save vehicle:', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.lookupContainer}>
          <Controller
            control={control}
            name="brand"
            render={({ field: { onChange, value, onBlur } }) => (
              <AppInput label="Hãng xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.brand?.message} style={styles.lookupInput} />
            )}
          />
          <Button onPress={handleLookup} loading={lookupLoading} style={styles.lookupButton}>Kiểm tra</Button>
        </View>
        <Controller
          control={control}
          name="model"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Mẫu xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.model?.message} style={styles.input} />
          )}
        />

        {lookupError && <Text style={{ color: colors.error, marginBottom: 16 }}>{lookupError}</Text>}

        {vehicleSpecs && (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>Thông số kỹ thuật</Text>
            <TextInput label="Dung lượng pin" value={vehicleSpecs.usable_battery_capacity} editable={false} />
            <TextInput label="Cổng sạc" value={vehicleSpecs.charge_port} editable={false} style={{ marginTop: 8 }} />
            <TextInput label="Công suất sạc tối đa" value={vehicleSpecs.max_charge_power} editable={false} style={{ marginTop: 8 }} />
          </View>
        )}

        <Controller
          control={control}
          name="year"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Năm sản xuất *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.year?.message} keyboardType="numeric" style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="plate_number"
          render={({ field: { onChange, value, onBlur } }) => (
            <AppInput label="Biển số xe *" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.plate_number?.message} autoCapitalize="characters" style={styles.input} />
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
          disabled={!isValid || loading}
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


