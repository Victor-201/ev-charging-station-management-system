import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
    marginRight: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  connectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  connectorBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectorText: {
    fontSize: 12,
    color: colors.onPrimaryContainer,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondaryContainer,
  },
  disabledButton: {
    backgroundColor: colors.surfaceDisabled,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.onPrimary,
  },
  secondaryButtonText: {
    color: colors.onSecondaryContainer,
  },
  disabledButtonText: {
    color: colors.onSurfaceDisabled,
  },
});

export default function StationBookingCard({
  station,
  onBook,
  onGetDirections,
  showActions = true
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getStatusColor = () => {
    if (station.status === 'maintenance' || station.status === 'offline') return colors.error;
    if ((station.available_ports || 0) === 0) return colors.warning;
    return colors.success;
  };

  const getStatusText = () => {
    if (station.status === 'maintenance') return 'Bảo trì';
    if (station.status === 'offline') return 'Ngoại tuyến';
    if ((station.available_ports || 0) === 0) return 'Hết chỗ';
    return 'Hoạt động';
  };

  const isBookingDisabled = station.status !== 'active' || (station.available_ports || 0) === 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.stationInfo}>
          <Text style={styles.stationName} numberOfLines={2} ellipsizeMode="tail">
            {station.name}
          </Text>
          <Text style={styles.stationAddress} numberOfLines={2} ellipsizeMode="tail">
            {station.address}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Icon name="power" size={18} color={getStatusColor()} style={styles.detailIcon} />
        <Text style={styles.detailText}>
          {station.available_ports || 0}/{station.total_ports || 0} cổng sạc
        </Text>
      </View>

      {station.price_per_kwh && (
        <View style={styles.detailsRow}>
          <Icon name="attach-money" size={18} color={colors.onSurface} style={styles.detailIcon} />
          <Text style={styles.detailText}>
            {Number(station.price_per_kwh).toLocaleString()} VND/kWh
          </Text>
        </View>
      )}

      {station.connector_types && station.connector_types.length > 0 && (
        <View style={styles.connectorContainer}>
          {station.connector_types.map((type, index) => (
            <View key={index} style={styles.connectorBadge}>
              <Text style={styles.connectorText}>{type}</Text>
            </View>
          ))}
        </View>
      )}

      {showActions && (
        <View style={styles.actionButtons}>
          {onGetDirections && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => onGetDirections(station)}
            >
              <Icon name="directions" size={18} color={colors.onSecondaryContainer} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Chỉ đường</Text>
            </TouchableOpacity>
          )}
          
          {onBook && (
            <TouchableOpacity 
              style={[
                styles.button, 
                isBookingDisabled ? styles.disabledButton : styles.primaryButton
              ]}
              onPress={() => onBook(station)}
              disabled={isBookingDisabled}
            >
              <Text style={[
                styles.buttonText, 
                isBookingDisabled ? styles.disabledButtonText : styles.primaryButtonText
              ]}>
                {isBookingDisabled ? 'Không khả dụng' : 'Đặt chỗ'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

