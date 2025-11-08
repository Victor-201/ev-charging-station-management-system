import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  vehicleInfo: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

const VehicleCard = ({ vehicle, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!vehicle) return null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name="car-electric" size={40} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.vehicleName}>{vehicle.nickname || `${vehicle.make} ${vehicle.model}`}</Text>
        <Text style={styles.vehicleInfo}>{vehicle.license_plate}</Text>
        {vehicle.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Mặc định</Text>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={24} color={colors.onSurface} style={{ opacity: 0.5 }} />
    </TouchableOpacity>
  );
};

export default VehicleCard;

