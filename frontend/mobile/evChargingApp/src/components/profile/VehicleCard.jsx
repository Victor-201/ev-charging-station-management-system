import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, IconButton } from 'react-native-paper';
import { theme } from '../../config/theme';

const VehicleCard = ({ vehicle, onPress }) => {
  if (!vehicle) return null;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconButton
            icon="car-electric"
            size={36}
            color={theme.colors.primary}
            style={styles.icon}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Title style={styles.title}>{`${vehicle.make} ${vehicle.model}`}</Title>
          <Paragraph style={styles.licensePlate}>{vehicle.license_plate}</Paragraph>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconButton icon="calendar" size={16} color={theme.colors.onSurface + '80'} style={styles.infoIcon} />
              <Text style={styles.infoText}>{vehicle.year}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconButton icon="battery-charging" size={16} color={theme.colors.onSurface + '80'} style={styles.infoIcon} />
              <Text style={styles.infoText}>{`${vehicle.battery_capacity} kWh`}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconButton icon="ev-plug-type2" size={16} color={theme.colors.onSurface + '80'} style={styles.infoIcon} />
              <Text style={styles.infoText}>{vehicle.connector_type}</Text>
            </View>
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <IconButton
            icon="chevron-right"
            size={28}
            color={theme.colors.onSurface + '40'}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    backgroundColor: theme.colors.brand50,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoIcon: {
    margin: 0,
    marginRight: 4,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurface + '90',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VehicleCard;
